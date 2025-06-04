import React, { useState, useEffect } from 'react';
import './App.css';

const ExamSeatingAllotment = () => {
    const [numDepartments, setNumDepartments] = useState('');
    const [departments, setDepartments] = useState([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [benchCapacity, setBenchCapacity] = useState('');
    const [numRows, setNumRows] = useState('');
    const [numCols, setNumCols] = useState('');
    const [numHalls, setNumHalls] = useState(0);
    const [seatingOrder, setSeatingOrder] = useState('row');
    const [absentRollNumbers, setAbsentRollNumbers] = useState('');
    const [seatingPlan, setSeatingPlan] = useState([]);
    const [studentsData, setStudentsData] = useState([]);

    useEffect(() => {
        // Fetch student data from backend when the component mounts
        const fetchStudentsData = async () => {
            try {
                const response = await fetch('http://localhost:5002/api/students');
                const data = await response.json();
                console.log("Fetched data:", data); 
                setStudentsData(data);
            } catch (error) {
                console.error("Error fetching students data:", error);
            }
        };

        fetchStudentsData();
    }, []);

    const rollNumberBases = {
        "Computer Engineering": 714023104001,
        "Mechanical Engineering": 714023114001,
        "Electrical Engineering": 714023106001,
        "Civil Engineering": 714023107001,
        "Electronics and Communication Engineering": 714023106001,
        "Information Technology": 714023600001,
        "Chemical Engineering": 714023700001,
        "Biomedical Engineering": 714023800001
    };

    const handleDepartmentChange = (index, value) => {
        const newDepartments = [...departments];
        newDepartments[index].name = value;
        setDepartments(newDepartments);
    };

    const handleStudentChange = (index, value) => {
        const newDepartments = [...departments];
        newDepartments[index].students = parseInt(value) || 0;
        setDepartments(newDepartments);
        updateTotalStudents(newDepartments);
    };

    const updateTotalStudents = (updatedDepartments) => {
        const total = updatedDepartments.reduce((sum, dept) => sum + dept.students, 0);
        setTotalStudents(total);
        calculateHalls(total);
    };

    const calculateHalls = (total) => {
        if (!total || !numRows || !numCols || !benchCapacity) {
            setNumHalls(0);
            return;
        }
        const seatsPerHall = numRows * numCols * benchCapacity;
        const requiredHalls = Math.ceil(total / seatsPerHall);
        setNumHalls(requiredHalls);
    };

    useEffect(() => {
        calculateHalls(totalStudents);
    }, [totalStudents, numRows, numCols, benchCapacity]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const departmentsData = departments.map((dept) => ({
            name: dept.name,
            students: dept.students,
            startRollNo: rollNumberBases[dept.name]
        }));

        let generatedSeatingPlan;
        if (seatingOrder === "row") {
            generatedSeatingPlan = allocateRowOrderSeats(departmentsData);
        } else if (seatingOrder === "column") {
            generatedSeatingPlan = allocateColumnOrderSeats(departmentsData);
        }

        setSeatingPlan(generatedSeatingPlan);
    };

    function filterAbsentRollNumbers(department) {
        const absentRolls = absentRollNumbers.split(',').map(num => num.trim());
        const rollNumbers = studentsData
            .filter(student => student.department === department.name && !absentRolls.includes(student.rollNumber.toString()))
            .map(student => `${student.name} (${student.rollNumber})`);

        return rollNumbers.slice(0, department.students);  // Limit to the number of students for this department
    }

    function allocateRowOrderSeats(departments) {
        const seatingPlan = [];
        const departmentQueues = departments.map(dept => filterAbsentRollNumbers(dept));

        let departmentIndex = 0;
        for (let hallIndex = 0; hallIndex < numHalls; hallIndex++) {
            let hallSeating = [];
            for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                let rowSeats = [];
                for (let colIndex = 0; colIndex < numCols; colIndex++) {
                    let seatContent = [];
                    for (let seatIndex = 0; seatIndex < benchCapacity; seatIndex++) {
                        if (departmentQueues[departmentIndex].length > 0) {
                            seatContent.push(departmentQueues[departmentIndex].shift());
                        } else {
                            seatContent.push("Empty");
                        }
                        departmentIndex = (departmentIndex + 1) % departments.length;
                    }
                    rowSeats.push(seatContent.join(", "));
                }
                hallSeating.push(rowSeats);
            }
            seatingPlan.push(hallSeating);
        }

        return seatingPlan;
    }

    function allocateColumnOrderSeats(departments) {
        const seatingPlan = [];
        const departmentQueues = departments.map(dept => filterAbsentRollNumbers(dept));

        let departmentIndex = 0;
        for (let hallIndex = 0; hallIndex < numHalls; hallIndex++) {
            let hallSeating = Array.from({ length: numRows }, () => Array(numCols).fill("Empty"));
            for (let colIndex = 0; colIndex < numCols; colIndex++) {
                for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                    let seatContent = [];
                    for (let seatIndex = 0; seatIndex < benchCapacity; seatIndex++) {
                        if (departmentQueues[departmentIndex].length > 0) {
                            seatContent.push(departmentQueues[departmentIndex].shift());
                        } else {
                            seatContent.push("Empty");
                        }
                        departmentIndex = (departmentIndex + 1) % departments.length;
                    }
                    hallSeating[rowIndex][colIndex] = seatContent.join(", ");
                }
            }
            seatingPlan.push(hallSeating);
        }

        return seatingPlan;
    }

    return (
        <div className="container" id="form-container">
            <h1>Exam Seating Allotment</h1>
            <form id="seating-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="num-departments">Number of Departments for exam:</label>
                    <input
                        type="number"
                        id="num-departments"
                        value={numDepartments}
                        min="2"
                        max="5"
                        onChange={(e) => {
                            setNumDepartments(e.target.value);
                            setDepartments(Array.from({ length: e.target.value }, (_, i) => ({ name: '', students: 0 })));
                            setTotalStudents(0);
                        }}
                        required
                    />
                </div>
                
                {Array.from({ length: numDepartments }).map((_, index) => (
                    <div key={index} className="form-group">
                        <label>Select Department {index + 1}:</label>
                        <select
                            required
                            onChange={(e) => handleDepartmentChange(index, e.target.value)}
                        >
                            <option value="">Select Department</option>
                            <option value="Computer Engineering">Computer Engineering</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Civil Engineering">Civil Engineering</option>
                            <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Chemical Engineering">Chemical Engineering</option>
                            <option value="Biomedical Engineering">Biomedical Engineering</option>
                        </select>
                        <label>Number of Students in Department {index + 1}:</label>
                        <input
                            type="number"
                            required
                            onChange={(e) => handleStudentChange(index, e.target.value)}
                        />
                    </div>
                ))}
                <div className="form-group">
                    <label>Total Students:</label>
                    <input type="number" value={totalStudents} readOnly />
                </div>
                <div className="form-group">
                    <label>Bench Capacity (1 or 2):</label>
                    <input
                        type="number"
                        min="1"
                        max="2"
                        value={benchCapacity}
                        onChange={(e) => setBenchCapacity(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Rows per Hall:</label>
                    <input
                        type="number"
                        value={numRows}
                        onChange={(e) => setNumRows(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Columns per Hall:</label>
                    <input
                        type="number"
                        value={numCols}
                        onChange={(e) => setNumCols(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Number of Halls:</label>
                    <input type="number" value={numHalls} readOnly />
                </div>
                <div className="form-group">
                    <label>Seating Order:</label>
                    <select
                        required
                        value={seatingOrder}
                        onChange={(e) => setSeatingOrder(e.target.value)}
                    >
                        <option value="row">Row Order</option>
                        <option value="column">Column Order</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Long Absent Roll Numbers:</label>
                    <input
                        type="text"
                        value={absentRollNumbers}
                        onChange={(e) => setAbsentRollNumbers(e.target.value)}
                    />
                </div>
                <button type="submit">Allocate Seats</button>
            </form>

            {seatingPlan.length > 0 && (
                <div>
                    <h2>Seating Plan</h2>
                    {seatingPlan.map((hall, hallIndex) => (
                        <div key={hallIndex}>
                            <h3>Hall {hallIndex + 1}</h3>
                            {hall.map((row, rowIndex) => (
                                <div key={rowIndex} style={{ display: 'flex' }}>
                                    {row.map((seat, colIndex) => (
                                        <div key={colIndex} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
                                            {seat}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExamSeatingAllotment;
