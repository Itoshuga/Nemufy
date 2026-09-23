import type { ReactNode } from "react";

export function DataTable({
  columns,
  children,
  label,
}: {
  columns: string[];
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
      <table
        className="w-full min-w-[720px] border-collapse text-left text-sm"
        aria-label={label}
      >
        <thead>
          <tr className="border-border border-b">
            {columns.map((column) => (
              <th
                key={column}
                className="text-subtle px-5 py-3 text-[10px] font-semibold tracking-[.14em] uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function DataCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}
