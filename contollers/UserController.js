const fs = require('fs');

const UserController = {
    getAll: async (req, res) => {
        try {
            const data = await fs.promises.readFile('./users.json', 'utf8');
            const users = JSON.parse(data);
            res.json(users);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.json([]);
            }
            console.error('Ошибка при чтении файла:', error);
            res.status(500).json({ error: "Внутренняя ошибка сервера" });
        }
    },

    getById: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "Некорректный ID" });
            }

            const data = await fs.promises.readFile('./users.json', 'utf8');
            const users = JSON.parse(data);
            
            const user = users.find(u => u.id === id);
            
            if (!user) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }
            
            res.json(user);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: "Пользователь не найден" });
            }
            console.error('Ошибка при чтении файла:', error);
            res.status(500).json({ error: "Внутренняя ошибка сервера" });
        }
    },

    create: async (req, res) => {
        const { name, phoneNumber } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: "Имя обязательно и должно быть непустой строкой" });
        }

        if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
            return res.status(400).json({ error: "Номер телефона обязателен" });
        }

        try {
            let users = [];
            
            try {
                const data = await fs.promises.readFile('./users.json', 'utf8');
                users = JSON.parse(data);
                
                const nameExists = users.some(user => 
                    user.name.toLowerCase() === name.trim().toLowerCase()
                );
                
                if (nameExists) {
                    return res.status(400).json({ error: "Имя уже занято" });
                }
                
            } catch (readError) {
                if (readError.code !== 'ENOENT') {
                    throw readError;
                }
                users = [];
            }

            const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

            const newUser = {
                id: newId,
                name: name.trim(),
                phoneNumber: phoneNumber.trim()
            };

            users.push(newUser);
            
            await fs.promises.writeFile('./users.json', JSON.stringify(users, null, 2));
            
            res.status(201).json(newUser);
            
        } catch (error) {
            console.error('Ошибка при создании пользователя:', error);
            res.status(500).json({ error: "Внутренняя ошибка сервера" });
        }
    },

    update: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const { name, phoneNumber } = req.body;

            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "Некорректный ID" });
            }

            if (!name && !phoneNumber) {
                return res.status(400).json({ error: "Нет данных для обновления" });
            }

            const data = await fs.promises.readFile('./users.json', 'utf8');
            const users = JSON.parse(data);
            
            const userIndex = users.findIndex(u => u.id === id);
            
            if (userIndex === -1) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }

            if (name) {
                if (typeof name !== 'string' || name.trim().length === 0) {
                    return res.status(400).json({ error: "Имя должно быть непустой строкой" });
                }
                
                const nameExists = users.some((user, index) => 
                    index !== userIndex && 
                    user.name.toLowerCase() === name.trim().toLowerCase()
                );
                
                if (nameExists) {
                    return res.status(400).json({ error: "Имя уже занято" });
                }
                
                users[userIndex].name = name.trim();
            }

            if (phoneNumber) {
                if (typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
                    return res.status(400).json({ error: "Номер телефона должен быть непустой строкой" });
                }
                
                users[userIndex].phoneNumber = phoneNumber.trim();
            }

            await fs.promises.writeFile('./users.json', JSON.stringify(users, null, 2));
            
            res.json(users[userIndex]);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: "Пользователь не найден" });
            }
            console.error('Ошибка при обновлении пользователя:', error);
            res.status(500).json({ error: "Внутренняя ошибка сервера" });
        }
    },

    delete: async (req, res) => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "Некорректный ID" });
            }

            const data = await fs.promises.readFile('./users.json', 'utf8');
            const users = JSON.parse(data);
            
            const userIndex = users.findIndex(u => u.id === id);
            
            if (userIndex === -1) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }

            const deletedUser = users.splice(userIndex, 1)[0];
            
            await fs.promises.writeFile('./users.json', JSON.stringify(users, null, 2));
            
            res.json({ 
                message: "Пользователь успешно удален",
                deletedUser 
            });
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: "Пользователь не найден" });
            }
            console.error('Ошибка при удалении пользователя:', error);
            res.status(500).json({ error: "Внутренняя ошибка сервера" });
        }
    }
};

module.exports = UserController;