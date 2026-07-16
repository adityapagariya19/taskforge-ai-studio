package com.taskforge.issue.infrastructure;

import com.taskforge.issue.domain.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface IssueRepository extends JpaRepository<Issue, UUID> {

    @Query("select i from Issue i where i.projectId = :projectId and i.deletedAt is null order by i.boardPosition asc")
    List<Issue> findActiveByProject(@Param("projectId") UUID projectId);

    List<Issue> findByEpicIdAndDeletedAtIsNull(UUID epicId);
}
