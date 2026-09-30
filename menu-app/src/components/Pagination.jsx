import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx';

const WINDOW = 5;

// 현재 쪽을 가운데 두고 최대 5개 번호를 보여준다. 쪽 번호는 1부터 센다.
const pageNumbers = (current, total) => {
  const start = Math.max(1, Math.min(current - Math.floor(WINDOW / 2), total - WINDOW + 1));
  const end = Math.min(total, start + WINDOW - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="쪽">
      <button
        type="button"
        className="page-btn label1 medium"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="앞 쪽"
      >
        <ChevronLeftIcon />
      </button>
      {pageNumbers(page, totalPages).map((number) => (
        <button
          key={number}
          type="button"
          className={`page-btn label1 ${number === page ? 'bold is-current' : 'medium'}`}
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        className="page-btn label1 medium"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="다음 쪽"
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
};

export default Pagination;
