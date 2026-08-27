export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", maxWidth: 720, margin: "40px auto", color: "#174873" }}>
      <h1>LDI Oracle MVP</h1>
      <p>
        Answers two questions: who is the Recorded Controller of this Authenticating Device, and
        whether identity cover is in force or available to purchase.
      </p>
      <p>Not a policy. Not a Bind. Discovery Index stays on a separate host.</p>
      <ul>
        <li>GET /api/v1/health</li>
        <li>GET /api/v1/oracle-identity</li>
        <li>GET /api/v1/cover?device_id= or ?agent_id=</li>
        <li>POST /api/v1/cover (signed with device key_id)</li>
        <li>POST /api/v1/cover/{id}/revoke</li>
      </ul>
      <p>Verified. Validated. Vested.</p>
    </main>
  );
}
