package com.taskforge.department.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "team_members")
@IdClass(TeamMember.TeamMemberId.class)
@Getter
@Setter
@NoArgsConstructor
public class TeamMember {

    @Id
    @Column(name = "team_id")
    private UUID teamId;

    @Id
    @Column(name = "organization_member_id")
    private UUID organizationMemberId;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt = Instant.now();

    public TeamMember(UUID teamId, UUID organizationMemberId) {
        this.teamId = teamId;
        this.organizationMemberId = organizationMemberId;
    }

    @NoArgsConstructor
    public static class TeamMemberId implements Serializable {
        private UUID teamId;
        private UUID organizationMemberId;

        public TeamMemberId(UUID teamId, UUID organizationMemberId) {
            this.teamId = teamId;
            this.organizationMemberId = organizationMemberId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof TeamMemberId that)) return false;
            return Objects.equals(teamId, that.teamId) && Objects.equals(organizationMemberId, that.organizationMemberId);
        }

        @Override
        public int hashCode() { return Objects.hash(teamId, organizationMemberId); }
    }
}
