const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const fs = require('fs').promises;
const userRouter = require('./routes/userRouter');

const app = express();
const PORT = process.env.PORT || 3000;
const usersFilePath = './users.json';

app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        cancelButton: function() {
            return '<a href="/" class="btn btn-cancel">Отказаться</a>';
        },
        eq: function(a, b) {
            return a === b;
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/users", userRouter);

async function readUsers() {
    try {
        const data = await fs.readFile(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

async function writeUsers(users) {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

app.get('/', async (req, res) => {
    try {
        const users = await readUsers();
        res.render('home', { 
            users,
            title: 'Телефонный справочник'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

app.get('/Add', async (req, res) => {
    try {
        const users = await readUsers();
        res.render('add', { 
            users,
            title: 'Добавление записи'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/Add', async (req, res) => {
    const { name, phoneNumber } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).send('Имя обязательно и не может быть пустым');
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
        return res.status(400).send('Телефон обязателен');
    }

    try {
        const users = await readUsers();

        const nameExists = users.some(u => u.name.toLowerCase() === name.trim().toLowerCase());
        if (nameExists) {
            return res.status(400).send('Имя уже существует');
        }

        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = {
            id: newId,
            name: name.trim(),
            phoneNumber: phoneNumber.trim()
        };

        users.push(newUser);
        await writeUsers(users);

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

app.get('/Update/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).send('Некорректный ID');
    }

    try {
        const users = await readUsers();
        const currentUser = users.find(u => u.id === id);
        if (!currentUser) {
            return res.status(404).send('Пользователь не найден');
        }

        res.render('update', { 
            users,
            currentUser,
            title: 'Редактирование записи'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/Update/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, phoneNumber } = req.body;

    if (isNaN(id) || id <= 0) {
        return res.status(400).send('Некорректный ID');
    }

    try {
        const users = await readUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) {
            return res.status(404).send('Пользователь не найден');
        }

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).send('Имя не может быть пустым');
        }
        
        const nameExists = users.some((u, i) => 
            i !== index && u.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (nameExists) {
            return res.status(400).send('Имя уже занято');
        }

        if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
            return res.status(400).send('Телефон не может быть пустым');
        }

        users[index].name = name.trim();
        users[index].phoneNumber = phoneNumber.trim();

        await writeUsers(users);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/Delete/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
        return res.status(400).send('Некорректный ID');
    }

    try {
        const users = await readUsers();
        const index = users.findIndex(u => u.id === id);
        
        if (index === -1) {
            return res.status(404).send('Пользователь не найден');
        }

        users.splice(index, 1);
        await writeUsers(users);
        
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});