
import { useEffect, useState } from "react";
import axios from "axios";


function App() {
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [registerMsg, setRegisterMsg] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/")
      .then(res => setMessage(res.data))
      .catch(err => console.error(err));
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios.get("http://localhost:5000/api/users")
      .then(res => setUsers(res.data))
      .catch(err => setUsers([]));
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = e => {
    e.preventDefault();
    setRegisterMsg("");
    axios.post("http://localhost:5000/api/users/register", form)
      .then(res => {
        setRegisterMsg(res.data.message);
        setForm({ username: '', email: '', password: '' });
        fetchUsers();
      })
      .catch(err => {
        let msg = "Registration failed";
        if (err.response?.data?.error) {
          msg = err.response.data.error;
        } else if (err.message) {
          msg = err.message;
        } else if (typeof err === 'string') {
          msg = err;
        } else {
          msg = JSON.stringify(err);
        }
        setRegisterMsg(msg);
      });
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Frontend + Backend Test</h1>
      <p>{message}</p>

      <h2>Register User</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" />
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} required type="password" />
        <button type="submit">Register</button>
      </form>
      {registerMsg && <p>{registerMsg}</p>}

      <h2>All Users</h2>
      <ul>
        {users.map(u => (
          <li key={u._id}>{u.username} ({u.email})</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
