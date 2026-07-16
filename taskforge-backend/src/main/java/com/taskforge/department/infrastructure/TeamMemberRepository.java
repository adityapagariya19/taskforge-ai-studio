package com.taskforge.department.infrastructure;

import com.taskforge.department.domain.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMember.TeamMemberId> {
    List<TeamMember> findByTeamId(UUID teamId);
    List<TeamMember> findByOrganizationMemberId(UUID organizationMemberId);
}
