import { useEffect, useState } from "react";

type User = {
  username: string;
  display_name: string;
  email: string;
  bio: string;
};

export default function Settings() {
  const [user, setUser] = useState<User>({
    username: "",
    display_name: "",
    email: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 1) Load user data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3001/api/users/1");
        const data = await res.json();
        setUser({
          username: data.username ?? "",
          display_name: data.display_name ?? "",
          email: data.email ?? "",
          bio: data.bio ?? "",
        });
      } catch (e) {
        console.error("Failed to load user", e);
        setMessage("❌ Failed to load user.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Local edits
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setUser({ ...user, [e.target.name]: e.target.value });
  }

  // 3) Save to backend
  async function handleSave() {
    try {
      const res = await fetch("http://localhost:3001/api/users/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      setMessage(res.ok ? "✅ Profile updated!" : "❌ Failed to save changes.");
    } catch (e) {
      console.error(e);
      setMessage("❌ Failed to save changes.");
    }
  }

  if (loading) return <p className="p-6">Loading user info…</p>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Settings</h1>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Display Name</label>
        <input
          className="border rounded p-2 w-full"
          name="display_name"
          value={user.display_name}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Email</label>
        <input
          className="border rounded p-2 w-full"
          name="email"
          type="email"
          value={user.email}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Bio</label>
        <textarea
          className="border rounded p-2 w-full"
          name="bio"
          rows={3}
          value={user.bio}
          onChange={handleChange}
        />
      </div>

      <button
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        onClick={handleSave}
      >
        Save Changes
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
