import React, { createContext, useContext, useState } from "react";

type StudentData = {
  name: string;
  username: string;
  school: string;
  educationType: "School" | "UG";
  class?: string;
  stream?: string;
  course?: string;
  year?: string;
  state: string;
  email: string;
  phone: string;
  password: string;
};

const StudentContext = createContext<{
  studentData: StudentData | null;
  setStudentData: (data: StudentData | null) => void;
  clearStudentData: () => void;
}>({
  studentData: null,
  setStudentData: () => {},
  clearStudentData: () => {},
});

export const useStudent = () => useContext(StudentContext);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  const clearStudentData = () => {
    setStudentData(null);
  };

  return (
    <StudentContext.Provider value={{ studentData, setStudentData, clearStudentData }}>
      {children}
    </StudentContext.Provider>
  );
};
