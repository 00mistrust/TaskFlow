// Function bach t-inviter chi user b l-email
async function inviteMember(projectId, email) {
    try {
        // Post request l-backend
        await axios.post(`/api/projects/${projectId}/invite`, { email });
        alert("Member invited successfully!");
        location.reload(); // Refresh bach t-update-a l-list
    } catch (err) {
        alert(err.response?.data?.msg || "Error inviting member");
    }
}

// Function bach t-remove chi user
async function removeMember(projectId, memberId) {
    // Confirmation bach may-t-hiyedch chi had bl-ghlat
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
        // Delete request l-backend
        await axios.delete(`/api/projects/${projectId}/members/${memberId}`);
        alert("Member removed!");
        location.reload(); // Refresh bach t-update-a l-list
    } catch (err) {
        alert(err.response?.data?.msg || "Error removing member");
    }
}