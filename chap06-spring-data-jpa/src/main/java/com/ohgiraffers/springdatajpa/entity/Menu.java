package com.ohgiraffers.springdatajpa.entity;

import jakarta.persistence.*;

@Entity
@Table(name="tbl_menu")
public class Menu {

	@Id
	@Column(name="menu_code")
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int menuCode;

	@Column(name="menu_name")
	private String menuName;

	@Column(name="menu_price")
	private int menuPrice;

	@Column(name="orderable_status")
	private String orderableStatus;

	/* 설명. 카테고리와의 연관 관계 (N:1)
	 *  ----------------------------------------------------------------------------------
	 *  하나의 DB 컬럼(category_code)은 하나의 필드에만 매핑한다.
	 *  즉 'private int categoryCode' 같은 필드를 따로 두지 않고, 이 연관 관계 필드 하나로만 다룬다.
	 *  ----------------------------------------------------------------------------------
	 *  주의. 같은 컬럼에 스칼라 필드와 연관 관계 필드를 둘 다 두면
	 *       한쪽에 insertable=false, updatable=false를 붙여 읽기 전용으로 만들어야 하는데,
	 *       이때 읽기 전용 필드의 값을 바꾸면 아무 오류 없이 조용히 무시된다.
	 *       (수정은 성공했다고 응답하는데 DB는 그대로인, 찾기 어려운 버그로 이어진다)
	 *       따라서 외래키는 연관 관계 필드 하나로만 다루는 편이 안전하다.
	 * */
	@ManyToOne
	@JoinColumn(name = "category_code")
	private Category category;

	public Menu() {}

	public Menu(int menuCode, String menuName, int menuPrice, String orderableStatus, Category category) {
		this.menuCode = menuCode;
		this.menuName = menuName;
		this.menuPrice = menuPrice;
		this.orderableStatus = orderableStatus;
		this.category = category;
	}

	public int getMenuCode() {
		return menuCode;
	}

	public void setMenuCode(int menuCode) {
		this.menuCode = menuCode;
	}

	public String getMenuName() {
		return menuName;
	}

	public void setMenuName(String menuName) {
		this.menuName = menuName;
	}

	public int getMenuPrice() {
		return menuPrice;
	}

	public void setMenuPrice(int menuPrice) {
		this.menuPrice = menuPrice;
	}

	public String getOrderableStatus() {
		return orderableStatus;
	}

	public void setOrderableStatus(String orderableStatus) {
		this.orderableStatus = orderableStatus;
	}

	public Category getCategory() {
		return category;
	}

	public void setCategory(Category category) {
		this.category = category;
	}

	/* 설명. 양방향 연관 관계에서 toString()에 연관 객체를 그대로 넣으면
	 *  서로를 계속 호출하다 StackOverflowError가 발생한다.
	 *  따라서 여기서는 카테고리 객체 대신 카테고리 코드만 출력한다.
	 * */
	@Override
	public String toString() {
		return "Menu{" +
				"menuCode=" + menuCode +
				", menuName='" + menuName + '\'' +
				", menuPrice=" + menuPrice +
				", orderableStatus='" + orderableStatus + '\'' +
				", categoryCode=" + (category != null ? category.getCategoryCode() : null) +
				'}';
	}
}
