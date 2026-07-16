package com.taskforge.aiagent.application;

import com.taskforge.aiagent.infrastructure.AIGeneratedFile;
import com.taskforge.aiagent.infrastructure.AIGeneratedFileRepository;
import com.taskforge.common.exception.ApiException;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Turns a CodeAI execution's persisted files into a real downloadable zip —
 * java.util.zip is part of the JDK, so this needs no extra dependency and
 * runs entirely in-process; there is no external service call, so a
 * MacBook-scale deployment never has to worry about this step being heavy.
 */
@Service
public class AIFileZipService {

    private final AIGeneratedFileRepository fileRepository;

    public AIFileZipService(AIGeneratedFileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    public record ZipResult(byte[] bytes, String suggestedFilename) {}

    public ZipResult buildZip(UUID executionId, String issueKey) {
        List<AIGeneratedFile> files = fileRepository.findByExecutionId(executionId);
        if (files.isEmpty()) {
            throw ApiException.notFound("This execution produced no downloadable files");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Set<String> usedNames = new HashSet<>();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (AIGeneratedFile file : files) {
                String safeName = sanitize(file.getFilename());
                safeName = dedupe(safeName, usedNames);
                zos.putNextEntry(new ZipEntry(safeName));
                zos.write(file.getContent().getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }
        } catch (IOException e) {
            // ByteArrayOutputStream/ZipOutputStream over an in-memory buffer does not throw
            // in practice, but the checked exception must be handled regardless.
            throw new IllegalStateException("Failed to build zip archive", e);
        }

        String suggested = (issueKey == null ? "taskforge-code" : issueKey.toLowerCase()) + "-codeai.zip";
        return new ZipResult(baos.toByteArray(), suggested);
    }

    /** Strips path traversal and unsafe characters — file names came from an LLM response, never trust them raw. */
    private String sanitize(String filename) {
        String cleaned = filename.replace("\\", "/");
        int lastSlash = cleaned.lastIndexOf('/');
        if (lastSlash >= 0) cleaned = cleaned.substring(lastSlash + 1);
        cleaned = cleaned.replaceAll("[^a-zA-Z0-9._-]", "_");
        return cleaned.isBlank() ? "file.txt" : cleaned;
    }

    private String dedupe(String name, Set<String> used) {
        if (used.add(name)) return name;
        String base = name; String ext = "";
        int dot = name.lastIndexOf('.');
        if (dot > 0) { base = name.substring(0, dot); ext = name.substring(dot); }
        int i = 2;
        String candidate;
        do { candidate = base + "-" + i + ext; i++; } while (!used.add(candidate));
        return candidate;
    }
}
