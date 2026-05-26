package com.cadsaas.project.domain.repository;

import com.cadsaas.common.enums.ProjectStatus;
import com.cadsaas.project.domain.entity.Project;
import com.cadsaas.user.domain.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class ProjectSpecification {

    private ProjectSpecification() {}

    public static Specification<Project> forUser(User user) {
        return (root, query, cb) -> cb.equal(root.get("user"), user);
    }

    public static Specification<Project> withStatus(String status) {
        if (status == null || status.isBlank()) return Specification.where(null);
        try {
            ProjectStatus ps = ProjectStatus.valueOf(status.toUpperCase());
            return (root, query, cb) -> cb.equal(root.get("status"), ps);
        } catch (IllegalArgumentException e) {
            return Specification.where(null);
        }
    }

    public static Specification<Project> withInputType(String inputType) {
        if (inputType == null || inputType.isBlank()) return Specification.where(null);
        try {
            Project.InputType type = Project.InputType.valueOf(inputType.toUpperCase());
            return (root, query, cb) -> cb.equal(root.get("inputType"), type);
        } catch (IllegalArgumentException e) {
            return Specification.where(null);
        }
    }

    public static Specification<Project> withSearch(String search) {
        if (search == null || search.isBlank()) return Specification.where(null);
        String pattern = "%" + search.toLowerCase() + "%";
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.like(cb.lower(root.get("name")), pattern));
            predicates.add(cb.like(cb.lower(
                cb.coalesce(root.get("prompt"), "")), pattern));
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Project> orderedByCreatedAtDesc() {
        return (root, query, cb) -> {
            if (query != null) query.orderBy(cb.desc(root.get("createdAt")));
            return cb.conjunction();
        };
    }

    public static Specification<Project> build(
            User user, String status, String inputType, String search) {
        return Specification
                .where(forUser(user))
                .and(withStatus(status))
                .and(withInputType(inputType))
                .and(withSearch(search))
                .and(orderedByCreatedAtDesc());
    }
}
