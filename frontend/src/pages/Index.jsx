import { Link } from "react-router-dom";
import useCurrentUser from "../components/useCurrentUser.jsx";


function Index() {
    const { user, loading } = useCurrentUser();

    if (loading) return <div>Loading...</div>;

    return <div>
        <h1>Welcome to the Index Page</h1>
        <div>
            {user ? (
                <>
                    <h1>Welcome back, {user.username}!</h1>
                    <p>User Type: {user.profile.user_type}</p>
                    {user.profile.photo && <img src={user.profile.photo} alt="Profile" />}
                    <Link to="/logout">Logout</Link>
                </>
            ) : (
                <>

                    <p>You are not logged in.</p>
                    <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
                </>
            )}
        </div>
    </div>;

}
export default Index;