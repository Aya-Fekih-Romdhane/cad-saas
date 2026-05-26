"""
CAD Generation Engine using CadQuery (OpenCascade wrapper).
Supports parametric 3D modeling with SolidWorks-compatible export.
"""
import cadquery as cq
from pathlib import Path
from loguru import logger
from typing import Optional
import math

from app.models.cad_params import CadParameters, ShapeType, Feature, FeatureType, ExportFormat


class CadEngine:
    """Generates 3D CAD models from structured parameters using CadQuery."""

    def generate(self, params: CadParameters, output_dir: Path) -> dict[str, Path]:
        """
        Generate a 3D model and return paths to exported files.
        Returns a dict mapping format -> file path.
        """
        logger.info(f"Generating {params.shape} model: {params.name}")

        shape = self._create_base_shape(params)
        shape = self._apply_features(shape, params)

        return shape

    def _create_base_shape(self, params: CadParameters) -> cq.Workplane:
        d = params.dimensions

        if params.shape == ShapeType.BOX:
            l = d.length or 100.0
            w = d.width or 50.0
            h = d.height or 20.0
            return cq.Workplane("XY").box(l, w, h)

        elif params.shape == ShapeType.CYLINDER:
            r = d.radius or (d.diameter / 2 if d.diameter else 25.0)
            h = d.height or 50.0
            return cq.Workplane("XY").cylinder(h, r)

        elif params.shape in (ShapeType.FLANGE, ShapeType.PLATE):
            return self._create_flange(params)

        elif params.shape == ShapeType.SHAFT:
            r = d.radius or (d.diameter / 2 if d.diameter else 10.0)
            h = d.height or d.length or 100.0
            return cq.Workplane("XY").cylinder(h, r)

        elif params.shape == ShapeType.BRACKET:
            return self._create_bracket(params)

        else:
            l = d.length or 100.0
            w = d.width or 50.0
            h = d.height or 20.0
            return cq.Workplane("XY").box(l, w, h)

    def _create_flange(self, params: CadParameters) -> cq.Workplane:
        d = params.dimensions
        outer_r = (d.diameter or 150.0) / 2
        thickness = d.thickness or 20.0
        inner_r = outer_r * 0.4

        return (
            cq.Workplane("XY")
            .circle(outer_r)
            .extrude(thickness)
            .faces(">Z")
            .workplane()
            .circle(inner_r)
            .cutThruAll()
        )

    def _create_bracket(self, params: CadParameters) -> cq.Workplane:
        d = params.dimensions
        l = d.length or 100.0
        w = d.width or 50.0
        h = d.height or 80.0
        t = d.thickness or 10.0

        return (
            cq.Workplane("XY")
            .box(l, t, h)
            .faces(">Z")
            .workplane()
            .box(l, w, t)
        )

    def _apply_features(self, shape: cq.Workplane, params: CadParameters) -> cq.Workplane:
        for feature in params.features:
            try:
                shape = self._apply_feature(shape, feature, params)
            except Exception as e:
                logger.warning(f"Failed to apply feature {feature.type}: {e}")
        return shape

    def _apply_feature(self, shape: cq.Workplane, feature: Feature, params: CadParameters) -> cq.Workplane:
        if feature.type == FeatureType.HOLE:
            return self._apply_holes(shape, feature, params)
        elif feature.type == FeatureType.CHAMFER:
            r = feature.radius or 2.0
            return shape.edges("|Z").chamfer(r)
        elif feature.type == FeatureType.FILLET:
            r = feature.radius or 3.0
            return shape.edges("|Z").fillet(r)
        elif feature.type == FeatureType.SLOT:
            return self._apply_slot(shape, feature)
        return shape

    def _apply_holes(self, shape: cq.Workplane, feature: Feature, params: CadParameters) -> cq.Workplane:
        diameter = feature.diameter or 10.0
        count = feature.count or 1

        if feature.pattern == "circular" and feature.pitch_circle_diameter:
            pcd_r = feature.pitch_circle_diameter / 2
            return (
                shape.faces(">Z")
                .workplane()
                .polarArray(pcd_r, 0, 360, count)
                .circle(diameter / 2)
                .cutThruAll()
            )

        depth = feature.depth
        if depth:
            return shape.faces(">Z").workplane().hole(diameter, depth)
        return shape.faces(">Z").workplane().hole(diameter)

    def _apply_slot(self, shape: cq.Workplane, feature: Feature) -> cq.Workplane:
        w = feature.diameter or 10.0
        l = (feature.depth or 30.0)
        return (
            shape.faces(">Z")
            .workplane()
            .slot2D(l, w)
            .cutThruAll()
        )

    def export(self, shape: cq.Workplane, output_dir: Path,
               project_id: str, formats: list[ExportFormat]) -> list[dict]:
        """Export shape to multiple formats and return file metadata."""
        output_dir.mkdir(parents=True, exist_ok=True)
        exported = []

        for fmt in formats:
            try:
                file_info = self._export_format(shape, output_dir, project_id, fmt)
                exported.append(file_info)
            except Exception as e:
                logger.error(f"Export to {fmt} failed: {e}")

        return exported

    def _export_format(self, shape: cq.Workplane, output_dir: Path,
                       project_id: str, fmt: ExportFormat) -> dict:
        fmt_str = fmt.value
        ext_map = {
            "STEP": ".step", "STL": ".stl", "OBJ": ".obj",
            "IGES": ".iges", "DXF": ".dxf"
        }
        mime_map = {
            "STEP": "model/step", "STL": "model/stl", "OBJ": "model/obj",
            "IGES": "model/iges", "DXF": "image/vnd.dxf"
        }

        ext = ext_map.get(fmt_str, ".step")
        file_name = f"{project_id}_{fmt_str.lower()}{ext}"
        file_path = output_dir / file_name

        if fmt_str == "STEP":
            cq.exporters.export(shape, str(file_path), cq.exporters.ExportTypes.STEP)
        elif fmt_str == "STL":
            cq.exporters.export(shape, str(file_path), cq.exporters.ExportTypes.STL)
        elif fmt_str == "IGES":
            cq.exporters.export(shape, str(file_path), cq.exporters.ExportTypes.IGES)
        elif fmt_str in ("OBJ", "DXF"):
            # Fall back to STEP for unsupported formats and rename
            tmp = output_dir / f"{project_id}_tmp.step"
            cq.exporters.export(shape, str(tmp), cq.exporters.ExportTypes.STEP)
            tmp.rename(file_path)

        size = file_path.stat().st_size if file_path.exists() else 0

        return {
            "name": file_name,
            "path": str(file_path),
            "type": fmt_str,
            "size": size,
            "mime_type": mime_map.get(fmt_str, "application/octet-stream"),
            "is_primary": fmt_str == "STEP"
        }
