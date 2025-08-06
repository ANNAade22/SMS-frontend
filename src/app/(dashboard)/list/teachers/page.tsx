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
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
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
  {
    header: "Classes",
    accessor: "classes",
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

// interface Subject {
//   _id: string;
//   name: string;
// }

// interface Class {
//   _id: string;
//   name: string;
// }

// interface User {
//   _id: string;
//   username: string;
// }

interface TeacherItem {
  id: string;
  name: string;
  surname: string;
  email: string;
  photo?: string;
  userId: {
    _id: string;
    username: string;
  };
  subjects: {
    _id: string;
    name: string;
  }[];
  classes: {
    _id: string;
    name: string;
  }[];
  phone: string;
  address: string;
}

const TeacherListPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const initialPage = Number(searchParams.get("page")) || 1;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // total pages

  const limit = 8;
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`?page=${page}`, { scroll: false });
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/v1/teachers?page=${currentPage}&limit=${limit}`
        );
        const teachersArray = response.data?.data?.data || [];
        console.log("Fetched teachers:", teachersArray);
        setTeachers(teachersArray);
        const total = response.data.total || response.data.results;
        setTotalPages(Math.ceil(total / limit));
        router.replace(`?page=${currentPage}`, { scroll: false });
      } catch (error) {
        console.log("Error while fatching", error);
      }
    };
    fetchData();
  }, [currentPage]);

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
        {" "}
        {item.subjects?.map((subject: any) => subject.name).join(", ") ||
          "No subjects"}
      </td>
      <td className="hidden md:table-cell">
        {item.classes.map((cls: any) => cls.name).join(", ")}
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
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
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
