import Form from "../components/Form.jsx";

export default function Auth() {
  return (
    <div className="container py-4">
      <div className="row g-4 align-items-stretch">
        <div className="col-12 col-md-6 d-flex">
          <div className="card shadow-sm w-100">
            <div className="card-body d-flex flex-column justify-content-start">
              <div className="mx-auto w-100" style={{ maxWidth: 420 }}>
                <Form route="/api/auth/token/" method="login" showSwitchLinks={false} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 d-flex">
          <div className="card shadow-sm w-100">
            <div className="card-body d-flex flex-column justify-content-start">
              <div className="mx-auto w-100" style={{ maxWidth: 420 }}>
                <Form
                  route="/api/auth/register/"
                  method="register"
                  showSwitchLinks={false}
                />

                <hr className="my-4" />

                <h5 className="mb-2">Dlaczego warto mieć konto?</h5>
                <ul className="mb-0 ps-3">
                  <li>Podbijanie wpisów</li>
                  <li>Możliwość ubiegania się o status redaktora</li>
                  <li>Dodawanie zgłoszeń</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
