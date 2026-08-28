export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", maxWidth: 720, margin: "40px auto", color: "#174873" }}>
      <h1>LDI Oracle MVP</h1>
      <p>
        Answers two questions: who is the Recorded Controller of this Authenticating Device, and
        whether identity cover is in force or available to purchase.
      </p>
      <p>Not a policy. Not a Bind. A cover query is released only after signed FS-QF-1.2 acceptance.</p>
      <ul>
        <li>GET /api/v1/health</li>
        <li>GET /api/v1/oracle-identity</li>
        <li>POST /api/v1/cover/offer</li>
        <li>POST /api/v1/cover/accept</li>
        <li>GET /api/v1/cover?device_id=&amp;accept_id= (after accept)</li>
        <li>POST /api/v1/cover (publish signed cover row)</li>
        <li>POST /api/v1/cover/[id]/revoke</li>
      </ul>
      <p>Verified. Validated. Vested.</p>
    </main>
  );
}
