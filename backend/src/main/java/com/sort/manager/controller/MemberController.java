package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.dto.CreateMemberRequest;
import com.sort.manager.dto.MemberDTO;
import com.sort.manager.dto.UpdateMemberEnabledRequest;
import com.sort.manager.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public ApiResponse<List<MemberDTO>> findAll() {
        return ApiResponse.ok(memberService.findAll());
    }

    @PostMapping
    public ApiResponse<MemberDTO> create(@Valid @RequestBody CreateMemberRequest request) {
        return ApiResponse.ok("家庭成员已创建", memberService.create(request));
    }

    @PatchMapping("/{id}/enabled")
    public ApiResponse<MemberDTO> setEnabled(@PathVariable Long id,
                                             @Valid @RequestBody UpdateMemberEnabledRequest request) {
        return ApiResponse.ok("成员状态已更新", memberService.setEnabled(id, request.enabled()));
    }

    @PostMapping("/{id}/revoke-sessions")
    public ApiResponse<Map<String, Integer>> revokeSessions(@PathVariable Long id) {
        return ApiResponse.ok("Member sessions revoked", Map.of("revokedCount", memberService.revokeSessions(id)));
    }
}
