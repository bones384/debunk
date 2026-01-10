import Form from "../components/Form.jsx";


function Login() {
    return <Form route="/api/auth/token/" method="login"/>;
}
export default Login;