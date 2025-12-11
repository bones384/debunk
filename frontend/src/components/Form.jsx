import {useState} from 'react';
import api from "../api";
import {useNavigate} from "react-router-dom";
import {ACCESS_TOKEN, REFRESH_TOKEN} from "../constants.js";

function Form({ route, method }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const name = method === "login" ? "Login" : "Register";
    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const response = await api.post(route, {
                username,
                password
            });

            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
                navigate('/');
            } else {
                alert("Registration successful! You can now log in.");
                navigate('/login');
            }
        }
        catch (error) {
            alert(error);
        }
        finally {
            setLoading(false);
        }


    }

    return <form onSubmit={handleSubmit}>
        <h1>{name}</h1>
        <input className="input" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="form-button" type="submit" disabled={loading}>{loading ? 'Please wait...' : name}</button>
    </form>
    }

    export default Form;