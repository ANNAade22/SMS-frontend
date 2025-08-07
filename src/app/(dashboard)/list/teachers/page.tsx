"use client";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

const columns = [
  { header: "Info", accessor: "info" },
  {
    header: "Teacher ID",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  {
    header: "Subjects",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  { header: "Classes", accessor: "classes", className: "hidden md:table-cell" },
  { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
  { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "action" },
];

interface TeacherItem {
  id: string;
  name: string;
  surname: string;
  email: string;
  photo?: string;
  userId: { _id: string; username: string };
  subjects: { _id: string; name: string }[];
  classes: { _id: string; name: string }[];
  phone: string;
  address: string;
}

type ClassType = { _id: string; name: string };

const limit = 6;

const TeacherListPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page")) || 1;
  const sort = searchParams.get("sort") || "name";
  const classId = searchParams.get("classId") || "";

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const fetchData = async () => {
    try {
      // Get classes
      const classRes = await axios.get("http://127.0.0.1:8000/api/v1/classes");
      setClasses(classRes.data?.data?.data || []);

      // Get teachers
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (sort) query.set("sort", sort);
      if (classId) query.set("classId", classId);

      const response = await axios.get(
        `http://127.0.0.1:8000/api/v1/teachers?${query.toString()}`
      );
      const teachersArray = response.data?.data?.data || [];
      const total = response.data.total || response.data.results || 0;

      setTeachers(teachersArray);
      setTotalPages(Math.ceil(total / limit));
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const renderRow = (item: TeacherItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item?.photo || "/avatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.userId.username}</td>
      <td className="hidden md:table-cell">
        {item.subjects?.map((subject: any) => subject.name).join(", ") ||
          "No subjects"}
      </td>
      <td className="hidden md:table-cell">
        {item.classes && item.classes.length > 0 ? (
          item.classes.map((cls) => (
            <span
              key={cls._id}
              className="inline-block mr-2 bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded"
            >
              {cls.name}
            </span>
          ))
        ) : (
          <span className="text-gray-500 italic">No classes assigned</span>
        )}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <FormModal table="teacher" type="delete" id={item.id} />
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
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <div className="relative">
              {/* Filter */}
              <button
                onClick={() => setShowFilter((prev) => !prev)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
              >
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              {showFilter && (
                <div className="absolute mt-2 z-50 bg-white border rounded-md shadow-md p-2">
                  <select
                    className="p-2 border rounded"
                    onChange={(e) => {
                      const selectedClassId = e.target.value;
                      const params = new URLSearchParams(searchParams);
                      if (selectedClassId) {
                        params.set("classId", selectedClassId);
                      } else {
                        params.delete("classId");
                      }
                      params.set("page", "1");
                      router.push(`?${params.toString()}`);
                    }}
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {/* Sort */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                const currentSort = params.get("sort");
                const newSort = currentSort === "name" ? "-name" : "name";
                params.set("sort", newSort);
                params.set("page", "1");
                router.push(`?${params.toString()}`);
              }}
            >
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            {role === "admin" && <FormModal table="teacher" type="create" />}
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={teachers} />

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default TeacherListPage;
