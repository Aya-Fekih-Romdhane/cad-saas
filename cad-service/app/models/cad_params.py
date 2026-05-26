from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ShapeType(str, Enum):
    BOX = "box"
    CYLINDER = "cylinder"
    SPHERE = "sphere"
    CONE = "cone"
    FLANGE = "flange"
    BRACKET = "bracket"
    GEAR = "gear"
    SHAFT = "shaft"
    PLATE = "plate"
    CUSTOM = "custom"


class ExportFormat(str, Enum):
    STEP = "STEP"
    STL = "STL"
    OBJ = "OBJ"
    IGES = "IGES"
    DXF = "DXF"


class FeatureType(str, Enum):
    HOLE = "hole"
    POCKET = "pocket"
    CHAMFER = "chamfer"
    FILLET = "fillet"
    BOSS = "boss"
    SLOT = "slot"
    THREAD = "thread"


class Dimensions(BaseModel):
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    diameter: Optional[float] = None
    radius: Optional[float] = None
    thickness: Optional[float] = None


class Position(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class Feature(BaseModel):
    type: FeatureType
    count: int = 1
    diameter: Optional[float] = None
    depth: Optional[float] = None
    radius: Optional[float] = None
    pattern: Optional[str] = None
    pitch_circle_diameter: Optional[float] = None
    position: Optional[Position] = None


class Material(BaseModel):
    name: str = "steel"
    type: str = "metal"
    density: Optional[float] = None


class CadParameters(BaseModel):
    shape: ShapeType
    name: str = "CAD Part"
    description: str = ""
    unit: str = "mm"
    dimensions: Dimensions
    features: List[Feature] = []
    material: Optional[Material] = None


class GenerationRequest(BaseModel):
    project_id: str
    cad_parameters: CadParameters
    export_formats: List[ExportFormat] = [ExportFormat.STEP, ExportFormat.STL, ExportFormat.OBJ]


class GeneratedFileInfo(BaseModel):
    name: str
    path: str
    type: str
    size: int
    mime_type: str
    is_primary: bool = False


class GenerationResponse(BaseModel):
    project_id: str
    status: str
    files: List[GeneratedFileInfo] = []
    message: str = ""
