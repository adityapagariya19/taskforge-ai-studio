package com.taskforge.sprint.infrastructure;

import com.taskforge.sprint.domain.Sprint;
import com.taskforge.sprint.domain.SprintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SprintRepository extends JpaRepository<Sprint, UUID> {
    List<Sprint> findByProjectIdOrderByStartDateDesc(UUID projectId);
    Optional<Sprint> findByProjectIdAndStatus(UUID projectId, SprintStatus status);
    boolean existsByProjectIdAndStatus(UUID projectId, SprintStatus status);
}
