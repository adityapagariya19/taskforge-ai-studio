package com.taskforge.permission.application;

import com.taskforge.permission.domain.Role;
import com.taskforge.permission.infrastructure.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Clones the 16 system role templates (organization_id IS NULL) into a brand
 * new organization, copying each template's permission grants exactly. This
 * is what makes per-organization custom roles possible later without any
 * special-casing: a custom role is simply another `roles` row with
 * is_system = false, created the same way a future "create custom role"
 * endpoint would create one.
 */
@Service
public class RoleTemplateService {

    private final RoleRepository roleRepository;

    public RoleTemplateService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional
    public void cloneSystemRolesInto(UUID organizationId) {
        List<Role> templates = roleRepository.findByOrganizationIdIsNull();
        for (Role template : templates) {
            Role clone = new Role();
            clone.setOrganizationId(organizationId);
            clone.setCode(template.getCode());
            clone.setName(template.getName());
            clone.setDescription(template.getDescription());
            clone.setSystem(true);
            clone.setAi(template.isAi());
            clone.setPermissions(template.getPermissions()); // same Permission rows, shared, not copied
            roleRepository.save(clone);
        }
    }
}
