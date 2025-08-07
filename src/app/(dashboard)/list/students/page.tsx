"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role, studentsData } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter, useSearchParams } from "next/navigation";

type Student = {
  _id?: string;
  id?: number;
  name: string;
  username: string;
  grade: number | string;
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
    header: "Info",
    accessor: "info",
  },
  {
    header: "Student ID",
    accessor: "studentId",
    className: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Address",
    accessor: "address",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const StudentListPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  ////

  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  ///

  const [students, setStudents] = useState<Student[]>([]);
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

    const newURL = `/list/students${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    router.push(newURL, { scroll: false });
  };

  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      let classesData = []; // ✅ Move declaration here

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

        classesData = data.data?.data || data.data || [];
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        // ✅ Fallback with empty or mock data
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

        const url = `http://127.0.0.1:8000/api/v1/students?${params}`;
        // console.log("🔍 Fetching teachers from:", url);

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch students");
        }

        const data = await res.json();

        if (data.status === "error") {
          throw new Error(data.message);
        }

        // Handle the nested data structure from backend
        const studentsData = data.data?.data || data.data || [];
        setStudents(studentsData);

        // Calculate total pages based on the limit used in the request
        const limit = 10;
        setTotalPages(Math.ceil((data.total || studentsData.length) / limit));

        // console.log("📊 API Response:", {
        //   total: data.total,
        //   results: data.results,
        //   teachersCount: teachersData.length,
        //   totalPages: Math.ceil((data.total || teachersData.length) / limit),
        // });

        // If no data from API, use mock data for development
        if (studentsData.length === 0) {
          console.log("No teachers data from API, using mock data");
          setStudents(studentsData); // This will be empty, but you can add mock data here if needed
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

  const renderRow = (item: Student & Class) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/avatar.png"
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">
            {Array.isArray(item.classes)
              ? item.classes
                  .map((cls) => (typeof cls === "string" ? cls : cls.name))
                  .join(", ")
              : "No classes"}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">
        {" "}
        {Array.isArray(item.grade)
          ? item.subjects
              .map((garde) => (typeof garde === "string" ? garde : garde.name))
              .join(", ")
          : "No subjects"}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
            //   <Image src="/delete.png" alt="" width={16} height={16} />
            // </button>
            <FormModal table="student" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch value={searchValue} onChange={handleSearch} />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              //   <Image src="/plus.png" alt="" width={14} height={14} />
              // </button>
              <FormModal table="student" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={students} />
      {/* PAGINATION */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default StudentListPage;
