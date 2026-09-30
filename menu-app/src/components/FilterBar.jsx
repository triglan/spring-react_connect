import { SearchIcon } from './Icons.jsx';

// 입력칸은 URL 값을 초기값으로만 받는다(uncontrolled). 확정된 조건은 URL 에만 있다.
// 부모가 URL 이 바뀔 때 key 를 바꿔 주면 뒤로가기 후에도 입력칸이 URL 과 맞춰진다.
const FilterBar = ({ filters, categoryGroups, categoriesFailed, onSubmit, onReset }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category = form.get('category');
    const price = String(form.get('price') ?? '').trim();

    onSubmit({
      q: String(form.get('q') ?? '').trim(),
      category: category ? Number(category) : null,
      price: price === '' ? null : Math.max(0, Math.trunc(Number(price))),
    });
  };

  return (
    <form className="filter-bar panel" onSubmit={handleSubmit} onReset={onReset} role="search">
      <div className="field">
        <label className="field-label label2 bold" htmlFor="filter-q">
          카드 이름
        </label>
        <div className="control">
          <span className="control-icon">
            <SearchIcon size={18} />
          </span>
          <input
            id="filter-q"
            name="q"
            type="search"
            className="body2 regular"
            placeholder="카드 이름 검색"
            defaultValue={filters.q}
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label label2 bold" htmlFor="filter-category">
          요리 계통
        </label>
        <div className="control">
          <select
            id="filter-category"
            name="category"
            className="body2 regular"
            defaultValue={filters.category ?? ''}
            disabled={categoriesFailed}
          >
            <option value="">{categoriesFailed ? '계통 목록 없음' : '모든 계통'}</option>
            {categoryGroups.map((group) => (
              <optgroup key={group.categoryCode} label={group.categoryName}>
                {group.children.map((category) => (
                  <option key={category.categoryCode} value={category.categoryCode}>
                    {category.categoryName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field-label label2 bold" htmlFor="filter-price">
          몸값
        </label>
        <div className="control">
          <input
            id="filter-price"
            name="price"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className="body2 regular"
            placeholder="예: 10000"
            defaultValue={filters.price ?? ''}
          />
          <span className="control-suffix label1 bold">G 초과</span>
        </div>
      </div>

      <div className="filter-actions">
        <button type="reset" className="btn btn-outlined label1 medium">
          비우기
        </button>
        <button type="submit" className="btn btn-primary label1 bold">
          찾기
        </button>
      </div>
    </form>
  );
};

export default FilterBar;
