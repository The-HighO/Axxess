import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import { Menu } from "../Menu";
import "../Filter/Filter.css";
import "./Pagination.css";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  pageSizes?: number[];
  onPageSizeChange: (size: number) => void;
  className?: string;
}

/** Pages to show: first, last, current ±1, with gaps as "…". */
function pageList(page: number, count: number): Array<number | "gap"> {
  const keep = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  if (page <= 3) [2, 3].forEach((p) => p <= count && keep.add(p));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/** Table footer: rows-per-page chip on the left, page numbers on the right. */
export function Pagination({ page, pageCount, onPageChange, pageSize, pageSizes = [10, 30, 50], onPageSizeChange, className }: PaginationProps) {
  return (
    <div className={cx("axo-pagination", className)}>
      <div className="axo-pagination__size">
        <Menu
          label="Rows per page"
          minWidth={80}
          items={pageSizes.map((size) => ({ id: String(size), label: String(size), selected: size === pageSize, onSelect: () => onPageSizeChange(size) }))}
          trigger={(t) => (
            <button type="button" className="axo-filter axo-filter--solid" aria-label={`${pageSize} rows per page`} {...t}>
              {pageSize}
              <Icon name="chevron-down-small" />
            </button>
          )}
        />
        <span className="axo-pagination__per">per page</span>
      </div>
      <nav className="axo-pagination__pages" aria-label="Pagination">
        <button type="button" className="axo-pagination__step" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <Icon name="chevron-left-small" size={16} />
        </button>
        {pageList(page, Math.max(1, pageCount)).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="axo-pagination__page axo-pagination__gap" aria-hidden="true">
              <Icon name="dots-horizontal" size={16} />
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={cx("axo-pagination__page", p === page && "is-current")}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className="axo-pagination__step" aria-label="Next page" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          <Icon name="chevron-right-16" size={16} />
        </button>
      </nav>
    </div>
  );
}
