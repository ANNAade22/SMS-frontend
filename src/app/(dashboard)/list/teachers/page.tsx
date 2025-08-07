"use client";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role, teachersData, classesData } from "@/lib/data";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter, useSearchParams } from "next/navigation";

type Teacher = {
  _id?: string;
  id?: number;
  name: string;
  email?: string;
  phone: string;
  address: string;
  subjects: Array<{ _id: string; name: string }> | string[];
  classes: Array<{ _id: string; name: string }> | string[];
};

type Class = {
  _id?: string;
  id?: number;
  name: string;
  capacity?: number;
  grade?: number;
  supervisor?: string;
};

const columns = [
  {
    header: "Teacher Info",
    accessor: "info",
    sortKey: "name",
  },
  {
    header: "Subjects",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  {
    header: "Classes",
    accessor: "classes",
    className: "hidden md:table-cell",
  },
  {
    header: "Contact",
    accessor: "contact",
    className: "hidden lg:table-cell",
    sortKey: "phone",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const TeacherListPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortField, setSortField] = useState(
    searchParams.get("sort")?.split(":")[0] || "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sort")?.split(":")[1] as "asc" | "desc") || "asc"
  );
  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") || ""
  );
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 500);

  // Update URL when filters change
  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const newURL = `/list/teachers${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    router.push(newURL, { scroll: false });
  };

  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        const res = await fetch("http://127.0.0.1:8000/api/v1/classes");

        if (!res.ok) {
          throw new Error("Failed to fetch classes");
        }

        const data = await res.json();

        if (data.status === "error") {
          throw new Error(data.message);
        }

        const classesData = data.data?.data || data.data || [];
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        // Use mock data as fallback
        setClasses(classesData);
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch teachers with filters
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setError(null);
        setLoading(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          sort: `${sortField}:${sortOrder}`,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(selectedClass && { classes: selectedClass }),
        });

        // Update URL with current filters
        updateURL({
          page: page.toString(),
          sort: `${sortField}:${sortOrder}`,
          search: debouncedSearch,
          class: selectedClass,
        });

        const url = `http://127.0.0.1:8000/api/v1/teachers?${params}`;
        // console.log("🔍 Fetching teachers from:", url);

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch teachers");
        }

        const data = await res.json();

        if (data.status === "error") {
          throw new Error(data.message);
        }

        // Handle the nested data structure from backend
        const teachersData = data.data?.data || data.data || [];
        setTeachers(teachersData);

        // Calculate total pages based on the limit used in the request
        const limit = 10;
        setTotalPages(Math.ceil((data.total || teachersData.length) / limit));

        // console.log("📊 API Response:", {
        //   total: data.total,
        //   results: data.results,
        //   teachersCount: teachersData.length,
        //   totalPages: Math.ceil((data.total || teachersData.length) / limit),
        // });

        // If no data from API, use mock data for development
        if (teachersData.length === 0) {
          console.log("No teachers data from API, using mock data");
          setTeachers(teachersData); // This will be empty, but you can add mock data here if needed
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching teachers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [debouncedSearch, selectedClass, sortField, sortOrder, page]);

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  const renderRow = (item: Teacher) => (
    <tr
      key={item._id || item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {Array.isArray(item.subjects)
          ? item.subjects
              .map((subject) =>
                typeof subject === "string" ? subject : subject.name
              )
              .join(", ")
          : "No subjects"}
      </td>
      <td className="hidden md:table-cell">
        {Array.isArray(item.classes)
          ? item.classes
              .map((cls) => (typeof cls === "string" ? cls : cls.name))
              .join(", ")
          : "No classes"}
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-col text-sm">
          <span>{item.phone}</span>
          <span className="text-gray-500">{item.address}</span>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="teacher" type="update" data={item} />
              <FormModal
                table="teacher"
                type="delete"
                id={item._id || item.id?.toString()}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-4 self-end relative">
            <div className="relative" ref={filterRef}>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
                onClick={() => setShowFilter(!showFilter)}
              >
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>

              {showFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Filter by Class</h3>
                      <button
                        onClick={() => setShowFilter(false)}
                        className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                      >
                        ×
                      </button>
                    </div>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        const newClass = e.target.value;
                        setSelectedClass(newClass);
                        setShowFilter(false); // Close filter after selection
                        setPage(1); // Reset to first page when filtering
                      }}
                      className="w-full p-2 border rounded"
                      disabled={classesLoading}
                    >
                      <option value="">All Classes</option>
                      {classesLoading ? (
                        <option value="" disabled>
                          Loading classes...
                        </option>
                      ) : (
                        classes.map((cls) => (
                          <option key={cls._id || cls.id} value={cls.name}>
                            {cls.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>

            {role === "admin" && <FormModal table="teacher" type="create" />}
          </div>

          <TableSearch
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page when searching
            }}
          />
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center p-4">Loading...</div>
      ) : error ? (
        <div className="flex justify-center p-4 text-red-500">{error}</div>
      ) : (
        <Table
          columns={columns}
          renderRow={renderRow}
          data={teachers}
          onSort={(field) => {
            if (field) {
              setSortField(field);
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              setPage(1); // Reset to first page when sorting
            }
          }}
        />
      )}

      {/* PAGINATION */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default TeacherListPage;
