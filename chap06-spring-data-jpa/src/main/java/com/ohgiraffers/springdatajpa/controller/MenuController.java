package com.ohgiraffers.springdatajpa.controller;

import com.ohgiraffers.springdatajpa.common.ResponseMessage;
import com.ohgiraffers.springdatajpa.dto.MenuDTO;
import com.ohgiraffers.springdatajpa.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menus")
@Tag(name = "메뉴", description = "메뉴 조회·등록·수정·삭제 API")
public class MenuController {

    private final MenuService menuService;

    // @Autowired를 작성하지 않아도 자동 적용됨을 잊지 말자.
    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    /* 목차. 1. 모든 메뉴 조회 */
    @Operation(summary = "전체 메뉴 조회", description = "result.menus에 전체 메뉴 목록을 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "메뉴 목록 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping
    public ResponseEntity<ResponseMessage> findAllMenus() {

        List<MenuDTO> menus = menuService.findAllMenus();
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menus", menus);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "메뉴 목록 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 2. 페이징 처리된 메뉴 목록 조회 */
    /**
     * 주어진 Pageable 정보를 바탕으로 메뉴 리스트를 조회하고, 페이지네이션 정보를 포함한 응답을 반환한다.
     *
     * <p>{@link org.springframework.data.domain.Pageable} 객체를 인자로 받아 페이지 요청 정보를
     * 처리한다. @PageableDefault 어노테이션을 통해 기본 페이지 설정을 지정할 수 있다.</p>
     *
     * @param pageable {@link org.springframework.data.domain.Pageable} 객체로, 페이지 번호, 크기, 정렬 정보를 관리한다.
     * @return 페이징 처리된 메뉴 목록과 페이지 정보를 포함한 ResponseEntity 객체
     */
    @GetMapping("/pages")
    @Operation(summary = "메뉴 페이지 조회", description = "페이지 번호는 1부터 시작한다. result에 content, totalElements, totalPages, size, number, first, last를 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "페이징 메뉴 목록 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> findMenuPage(
            @ParameterObject @PageableDefault Pageable pageable
    ) {

        System.out.println("pageable = " + pageable);

        Page<MenuDTO> menuPage = menuService.findMenuList(pageable);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("content", menuPage.getContent());              // 현재 페이지의 데이터
        resultMap.put("totalElements", menuPage.getTotalElements());  // 전체 데이터 수
        resultMap.put("totalPages", menuPage.getTotalPages());        // 전체 페이지 수
        resultMap.put("size", menuPage.getSize());                    // 페이지 크기
        /* 설명. one-indexed-parameters 설정은 '요청'의 page 파라미터에만 적용된다.
         *  Page.getNumber()는 여전히 0부터 시작하므로, 요청과 응답의 기준을 맞추기 위해 +1 해서 내려준다.
         * */
        resultMap.put("number", menuPage.getNumber() + 1);            // 현재 페이지 번호(1부터 시작)
        resultMap.put("first", menuPage.isFirst());                   // 첫 페이지 여부
        resultMap.put("last", menuPage.isLast());                     // 마지막 페이지 여부
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "페이징 처리된 메뉴 목록 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 3. 정렬 기능이 추가된 페이징 처리 메뉴 목록 조회 */
    /**
     * 사용자가 지정한 페이지, 크기, 정렬 기준, 정렬 방향에 따라 메뉴 목록을 조회한다.
     * 
     * <p>클라이언트에서 전달한 파라미터로 페이징 및 정렬을 적용하여 메뉴 목록을 조회하고,
     * 결과를 반환한다. 정렬 기준과 방향을 동적으로 지정할 수 있다.</p>
     *
     * <p>페이지 번호와 크기는 위 findMenuPage()와 동일하게 Pageable로 받는다.
     * 그래야 one-indexed-parameters 설정이 두 엔드포인트에 똑같이 적용되어
     * 같은 page 값이 항상 같은 페이지를 가리키게 된다.
     * (page와 size를 int로 직접 받으면 이 설정이 적용되지 않아 두 API의 기준이 어긋난다)</p>
     *
     * @param pageable 페이지 번호와 크기를 담은 Pageable 객체 (기본 크기: 5)
     * @param sortBy 정렬 기준 필드 (기본값: menuPrice)
     * @param direction 정렬 방향 (asc 또는 desc, 기본값: asc)
     * @return 페이징 및 정렬이 적용된 메뉴 목록과 페이지 정보를 포함한 ResponseEntity 객체
     */
    @GetMapping("/pages/sort")
    @Operation(summary = "정렬된 메뉴 페이지 조회", description = "페이지 번호는 1부터 시작한다. result에 content, totalElements, totalPages, size, number, first, last, sort, direction을 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "정렬된 페이징 메뉴 목록 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> findMenuPageWithSort(
            @ParameterObject @PageableDefault(size = 5) Pageable pageable,
            @Parameter(description = "정렬 기준 필드", example = "menuPrice") @RequestParam(defaultValue = "menuPrice") String sortBy,
            @Parameter(description = "정렬 방향", example = "asc") @RequestParam(defaultValue = "asc") String direction
    ) {
        // 정렬 방향 설정
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ?
                Sort.Direction.DESC : Sort.Direction.ASC;

        // 정렬 객체 생성
        Sort sort = Sort.by(sortDirection, sortBy);

        // 페이징 처리된 메뉴 조회
        Page<MenuDTO> menuPage = menuService.findMenuListWithSort(pageable, sort);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("content", menuPage.getContent());              // 현재 페이지의 데이터
        resultMap.put("totalElements", menuPage.getTotalElements());  // 전체 데이터 수
        resultMap.put("totalPages", menuPage.getTotalPages());        // 전체 페이지 수
        resultMap.put("size", menuPage.getSize());                    // 페이지 크기
        /* 설명. one-indexed-parameters 설정은 '요청'의 page 파라미터에만 적용된다.
         *  Page.getNumber()는 여전히 0부터 시작하므로, 요청과 응답의 기준을 맞추기 위해 +1 해서 내려준다.
         * */
        resultMap.put("number", menuPage.getNumber() + 1);            // 현재 페이지 번호(1부터 시작)
        resultMap.put("first", menuPage.isFirst());                   // 첫 페이지 여부
        resultMap.put("last", menuPage.isLast());                     // 마지막 페이지 여부
        resultMap.put("sort", sortBy);                                // 정렬 기준 필드
        resultMap.put("direction", direction);                        // 정렬 방향
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "페이징 처리 및 정렬이 적용된 메뉴 목록 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 4. 메뉴 코드로 단일 메뉴 조회 */
    /**
     * 메뉴 코드에 해당하는 단일 메뉴를 조회한다.
     * 
     * <p>경로 변수로 전달된 메뉴 코드를 사용하여 메뉴를 조회하고, 결과를 반환한다.</p>
     *
     * @param menuCode 조회할 메뉴의 코드 (PK)
     * @return 조회된 메뉴 정보를 포함한 ResponseEntity 객체
     */
    @GetMapping("/{menuCode}")
    @Operation(summary = "메뉴 상세 조회", description = "result.menu에 조회한 메뉴를 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "메뉴 상세 조회 성공"),
            @ApiResponse(responseCode = "404", description = "메뉴를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> findMenuByCode(
            @Parameter(description = "조회할 메뉴 코드", example = "1") @PathVariable int menuCode
    ) {

        MenuDTO menu = menuService.findMenuByCode(menuCode);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menu", menu);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "메뉴 상세 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 5. 가격 기준 메뉴 검색 */
    /**
     * 지정된 가격을 초과하는 메뉴 목록을 조회한다.
     * 
     * <p>쿼리 파라미터로 전달된 가격보다 높은 가격의 메뉴 목록을 조회하고, 결과를 반환한다.</p>
     *
     * @param menuPrice 기준 가격
     * @return 기준 가격을 초과하는 메뉴 목록을 포함한 ResponseEntity 객체
     */
    @GetMapping("/search")
    @Operation(summary = "가격 기준 메뉴 검색", description = "지정 가격을 초과하는 메뉴를 result.menus에, 기준 가격을 result.searchPrice에 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "가격 기준 메뉴 검색 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> findMenusByPrice(
            @Parameter(description = "초과 조건에 사용할 기준 가격", example = "10000") @RequestParam Integer menuPrice
    ) {

        List<MenuDTO> menus = menuService.findMenusByPrice(menuPrice);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menus", menus);
        resultMap.put("searchPrice", menuPrice);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                menuPrice + "원 초과 메뉴 목록 조회 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 6. 새 메뉴 등록 */
    /**
     * 새로운 메뉴를 등록한다.
     * 
     * <p>요청 본문으로 전달된 메뉴 정보를 사용하여 새 메뉴를 등록하고, 등록된 메뉴 정보를 반환한다.</p>
     *
     * @param menuDTO 등록할 메뉴 정보
     * @return 등록된 메뉴 정보를 포함한 ResponseEntity 객체
     */
    @PostMapping
    @Operation(summary = "메뉴 등록", description = "menuCode는 서버가 생성한다. result.menu에 등록된 메뉴를 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "메뉴 등록 성공"),
            @ApiResponse(responseCode = "400", description = "유효하지 않은 요청 값"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> saveMenu(@RequestBody MenuDTO menuDTO) {

        MenuDTO savedMenu = menuService.saveMenu(menuDTO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menu", savedMenu);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.CREATED.value(),
                "메뉴 등록 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(responseMessage);
    }

    /* 목차. 7. 메뉴 수정 */
    /**
     * 지정된 메뉴 코드의 메뉴 정보를 수정한다.
     * 
     * <p>경로 변수로 전달된 메뉴 코드와 요청 본문으로 전달된 메뉴 정보를 사용하여 
     * 기존 메뉴를 수정하고, 수정된 메뉴 정보를 반환한다.</p>
     *
     * @param menuCode 수정할 메뉴의 코드 (PK)
     * @param menuDTO 수정할 메뉴 정보
     * @return 수정된 메뉴 정보를 포함한 ResponseEntity 객체
     */
    @PutMapping("/{menuCode}")
    @Operation(summary = "메뉴 수정", description = "result.menu에 수정된 메뉴를 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "메뉴 수정 성공"),
            @ApiResponse(responseCode = "400", description = "유효하지 않은 요청 값"),
            @ApiResponse(responseCode = "404", description = "메뉴를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> updateMenu(
            @Parameter(description = "수정할 메뉴 코드", example = "1") @PathVariable int menuCode,
            @RequestBody MenuDTO menuDTO
    ) {

        MenuDTO updatedMenu = menuService.updateMenu(menuCode, menuDTO);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menu", updatedMenu);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.OK.value(),
                "메뉴 수정 성공",
                resultMap
        );
        
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseMessage);
    }

    /* 목차. 8. 메뉴 삭제 */
    /**
     * 지정된 메뉴 코드의 메뉴를 삭제한다.
     * 
     * <p>경로 변수로 전달된 메뉴 코드에 해당하는 메뉴를 삭제하고, 삭제 결과를 반환한다.</p>
     *
     * @param menuCode 삭제할 메뉴의 코드 (PK)
     * @return 삭제된 메뉴 코드를 포함한 ResponseEntity 객체
     */
    @DeleteMapping("/{menuCode}")
    @Operation(summary = "메뉴 삭제", description = "실제 HTTP 상태는 200이고 응답 본문의 httpStatus는 204다. result.deletedMenuCode에 삭제한 메뉴 코드를 담아 반환한다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "메뉴 삭제 성공"),
            @ApiResponse(responseCode = "404", description = "메뉴를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<ResponseMessage> deleteMenu(
            @Parameter(description = "삭제할 메뉴 코드", example = "1") @PathVariable int menuCode
    ) {

        menuService.deleteMenu(menuCode);
        
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("deletedMenuCode", menuCode);
        
        ResponseMessage responseMessage = new ResponseMessage(
                HttpStatus.NO_CONTENT.value(),
                "메뉴 삭제 성공",
                resultMap
        );
        
        return ResponseEntity
                // 실제 NO_CONTENT(204)는 응답 바디를 포함하지 않으므로 OK(200)로 변경
                .status(HttpStatus.OK)
                .body(responseMessage);
    }
}
