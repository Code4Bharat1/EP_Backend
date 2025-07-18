import jwt from "jsonwebtoken"

demoSignup = async (req, res) => {
    try {
        const { name, email, phone, company } = req.body;
        
        // Validate required fields
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email, and phone are required' });
        }
        
        // Check if user already exists by phone number
        const existingUser = users.find(user => user.phone === phone);
        if (existingUser) {
            return res.status(409).json({ error: 'User with this phone number already exists' });
        }
        
        // Create a demo user (in a real app, you'd hash the password)
        const demoUser = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            company: company || '',
            isDemo: true,
            createdAt: new Date()
        };
        
        // Add to "database"
        users.push(demoUser);
        
        // Create JWT token
        const token = jwt.sign(
            { userId: demoUser.id, phone: demoUser.phone },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
        
        // Return user data and token (excluding sensitive info in a real app)
        res.status(201).json({
            message: 'Demo account created successfully',
            user: demoUser,
            token
        });
        
    } catch (error) {
        console.error('Error in demo signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};