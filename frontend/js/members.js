async function inviteMember(projectId, email) {
    try {
        
        await axios.post(`/api/projects/${projectId}/invite`, { email });
        alert("Member invited successfully!");
        location.reload(); 
    } catch (err) {
        alert(err.response?.data?.msg || "Error inviting member");
    }
}


async function removeMember(projectId, memberId) {
    
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
        // Delete request l-backend
        await axios.delete(`/api/projects/${projectId}/members/${memberId}`);
        alert("Member removed!");
        location.reload(); 
    } catch (err) {
        alert(err.response?.data?.msg || "Error removing member");
    }
}