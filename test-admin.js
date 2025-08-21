const API_URL = "http://localhost:5001";

async function testAdminCreation() {
    try {
        console.log("Creating admin user...");
        const createResponse = await fetch(`${API_URL}/api/Users/create-admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        if (createResponse.ok) {
            const result = await createResponse.json();
            console.log("Admin creation result:", result);
            
            // Now try to login with admin
            console.log("Logging in with admin...");
            const loginResponse = await fetch(`${API_URL}/api/Auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: "admin", password: "admin123" })
            });
            
            if (loginResponse.ok) {
                const loginResult = await loginResponse.json();
                console.log("Login successful:", loginResult);
                
                // Test the Users endpoint with the token
                console.log("Testing Users endpoint...");
                const usersResponse = await fetch(`${API_URL}/api/Users`, {
                    headers: { 
                        "Authorization": `Bearer ${loginResult.token}`,
                        "Content-Type": "application/json"
                    }
                });
                
                if (usersResponse.ok) {
                    const users = await usersResponse.json();
                    console.log("Users endpoint successful:", users);
                } else {
                    console.error("Users endpoint failed:", usersResponse.status, await usersResponse.text());
                }
            } else {
                console.error("Login failed:", loginResponse.status, await loginResponse.text());
            }
        } else {
            console.error("Admin creation failed:", createResponse.status, await createResponse.text());
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testAdminCreation();
