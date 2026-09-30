package com.ohgiraffers.springdatajpa.controller;

import com.ohgiraffers.springdatajpa.common.ResponseMessage;
import com.ohgiraffers.springdatajpa.dto.CategoryDTO;
import com.ohgiraffers.springdatajpa.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "카테고리", description = "카테고리 조회 API")
public class CategoryController {

    private final CategoryService categoryService;

    // @Autowired를 작성하지 않아도 자동 적용됨을 잊지 말자.
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "전체 카테고리 조회", description = "result.categories에 전체 카테고리 목록을 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "카테고리 목록 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> findAllCategories() {
        List<CategoryDTO> categories = categoryService.findAllCategories();
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("categories", categories);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "카테고리 목록 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    @GetMapping("/{categoryCode}")
    @Operation(summary = "카테고리 상세 조회", description = "result.category에 조회한 카테고리를 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "카테고리 상세 조회 성공"),
            @ApiResponse(responseCode = "404", description = "카테고리를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> findCategoryByCode(
            @Parameter(description = "조회할 카테고리 코드", example = "1") @PathVariable int categoryCode
    ) {
        CategoryDTO category = categoryService.findCategoryByCode(categoryCode);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("category", category);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "카테고리 상세 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }
} 
