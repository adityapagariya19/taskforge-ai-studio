package com.taskforge.collaboration.infrastructure;

import com.taskforge.collaboration.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByIssueIdOrderByCreatedAtAsc(UUID issueId);
    List<Comment> findTop5ByIssueIdOrderByCreatedAtDesc(UUID issueId);
}
