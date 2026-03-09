import { useState, useEffect } from "react";

function App() {
    const [todos, setTodos] = useState([]);
    const [text, setText] = useState("");

    useEffect(() => {
        fetch("/api/todos")
            .then((res) => res.json())
            .then(setTodos);
    }, []);

    const addTodo = async () => {
        if (!text.trim()) return;
        const res = await fetch("/api/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        const todo = await res.json();
        setTodos([todo, ...todos]);
        setText("");
    };

    return (
        <div className="app">
            <h1>Todo App</h1>
            <div className="input-row">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter a todo"
                    onKeyDown={(e) => e.key === "Enter" && addTodo()}
                />
                <button onClick={addTodo}>Add</button>
            </div>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}>{todo.text}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;
