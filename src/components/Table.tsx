const Table = ({
  columns,
  renderRow,
  data,
  onSort,
}: {
  columns: {
    header: string;
    accessor: string;
    className?: string;
    sortKey?: string;
  }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  onSort?: (field: string) => void;
}) => {
  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-sm">
          {columns.map((col) => (
            <th
              key={col.accessor}
              className={`${col.className} ${
                col.sortKey ? "cursor-pointer hover:bg-gray-50" : ""
              }`}
              onClick={() => col.sortKey && onSort?.(col.sortKey)}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map((item) => renderRow(item))}</tbody>
    </table>
  );
};

export default Table;
