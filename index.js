import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { config } from 'dotenv';
import pool from './db.js'; 
import serverless from 'serverless-http';
import { authenticateUser, authorizeRole,matchUserId } from './middleware/auth.js';

config();  

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('API is working!');
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

app.get('/debug-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Debug DB error:", err);
    res.status(500).json({ error: err.message });
  }
});



app.post('/users/signup', async (req, res) => {
  const { name, email, mobile_number, password ,role = 'user'} = req.body;

  try {
    // Hash password before storing in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user data into the users table
    const result = await pool.query(
      `INSERT INTO users (name, email, mobile_number, password,role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, mobile_number,role`,
      [name, email, mobile_number, hashedPassword,role]
    );

    // Respond with the newly created user data
    const user = result.rows[0];
    res.status(201).json({
      message: "User created successfully",
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
});



app.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" }); // ✅ JSON
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" }); // ✅ JSON
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid email or password" }); // ✅ JSON
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.SECERET_KEY_BACKEND_JWT,
      { expiresIn: '7d' }
    );

    res.status(200).json({ message: "Login successful", token }); // ✅ JSON
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log in", error: err.message }); // ✅ JSON
  }
});




app.post('/products',authenticateUser,authorizeRole("admin"), async (req, res) => {
  const { name, price_per_kg, rating,image } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, price_per_kg, rating,image)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, price_per_kg, rating,image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: err.message });
  }
});




app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
});




app.post('/orders',authenticateUser, async (req, res) => {
  const { buyer_name, mobile_number, delivery_address, items } = req.body;

  try {
    // Step 1: Insert buyer info into orders table
    const orderResult = await pool.query(
      `INSERT INTO orders (buyer_name, mobile_number, delivery_address)
       VALUES ($1, $2, $3) RETURNING id`,
      [buyer_name, mobile_number, delivery_address]
    );

    const orderId = orderResult.rows[0].id;

    // Step 2: Insert each item into order_items
    for (const item of items) {
      const { product_id, quantity } = item;

      // Fetch product price_per_kg
      const productRes = await pool.query(
        'SELECT price_per_kg FROM products WHERE id = $1',
        [product_id]
      );
      const pricePerKg = productRes.rows[0].price_per_kg;

      const total_price = pricePerKg * quantity;

      // Insert into order_items
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, total_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, product_id, quantity, total_price]
      );
    }

    res.status(201).json({ message: 'Order placed successfully!', orderId });

  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: err.message });
  }
});



app.get('/orders',authenticateUser,authorizeRole("admin"), async (req, res) => {
  try {
    const ordersRes = await pool.query(`
      SELECT o.id AS order_id, o.buyer_name, o.mobile_number, o.delivery_address, o.status, o.created_at,
             oi.product_id, p.name AS product_name, oi.quantity, oi.total_price
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      ORDER BY o.created_at DESC
    `);

    res.json(ordersRes.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: err.message });
  }
});




app.patch('/orders/:id/status',authenticateUser,authorizeRole("admin"), async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body; // Assume we only want to update the status

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order updated', order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order' });
  }
});



app.delete('/products/:id',authenticateUser,authorizeRole("admin"), async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});


app.delete('/orders/:id', authenticateUser, matchUserId, async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rowCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await pool.query(
      `DELETE FROM orders WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ message: 'Order deleted successfully', order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete order' });
  }
});



app.get('/me', authenticateUser, (req, res) => {
  res.status(200).json({ user: req.user });
});



app.delete('/order-items/:id', authenticateUser, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `DELETE FROM order_items WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    res.json({ message: 'Order item deleted successfully', order_item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete order item' });
  }
});



app.post('/cart',authenticateUser, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  try {
    // Check if the user already has a cart
    let cartResult = await pool.query(
      `SELECT * FROM carts WHERE user_id = $1 LIMIT 1`,
      [user_id]
    );

    let cartId;
    if (cartResult.rowCount === 0) {
      // If no cart, create a new cart for the user
      const cartInsert = await pool.query(
        `INSERT INTO carts (user_id) VALUES ($1) RETURNING id`,
        [user_id]
      );
      cartId = cartInsert.rows[0].id;
    } else {
      // If cart exists, use that
      cartId = cartResult.rows[0].id;
    }

    // Get product details
    const productResult = await pool.query(
      `SELECT price_per_kg FROM products WHERE id = $1`,
      [product_id]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResult.rows[0];
    const totalPrice = quantity * product.price_per_kg;

    // Add item to cart
    const result = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, total_price) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [cartId, product_id, quantity, totalPrice]
    );

    res.status(201).json({ message: 'Item added to cart', item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});





app.get('/cart/:user_id',authenticateUser,matchUserId, async (req, res) => {
  const { user_id } = req.params;

  try {
    // Get the user's cart
    const cartResult = await pool.query(
      `SELECT * FROM carts WHERE user_id = $1 LIMIT 1`,
      [user_id]
    );

    if (cartResult.rowCount === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartId = cartResult.rows[0].id;

    // Get all items in the cart
    const itemsResult = await pool.query(
      `SELECT ci.id, ci.product_id, p.name AS product_name, ci.quantity, ci.total_price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    const total_price = itemsResult.rows.reduce((sum, item) => sum + item.total_price, 0);
    res.json({ cart_id: cartId, total_price, items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve cart items' });
  }
});




app.delete('/cart/:user_id/items/:id',authenticateUser,matchUserId, async (req, res) => {
  const { user_id, id } = req.params;

  try {
    // Get the user's cart
    const cartResult = await pool.query(
      `SELECT * FROM carts WHERE user_id = $1 LIMIT 1`,
      [user_id]
    );

    if (cartResult.rowCount === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartId = cartResult.rows[0].id;

    // Delete the item from the cart
    const result = await pool.query(
      `DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING *`,
      [id, cartId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart', item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove item from cart' });
  }
});





app.post('/cart/:user_id/checkout', authenticateUser, matchUserId, async (req, res) => {
  const { user_id } = req.params;
  const { buyer_name, mobile_number, delivery_address } = req.body;

  try {
    // Get the user's cart
    const cartResult = await pool.query(
      `SELECT * FROM carts WHERE user_id = $1 LIMIT 1`,
      [user_id]
    );

    if (cartResult.rowCount === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartId = cartResult.rows[0].id;

    // Get the items in the cart
    const cartItemsResult = await pool.query(
      `SELECT * FROM cart_items WHERE cart_id = $1`,
      [cartId]
    );

    if (cartItemsResult.rowCount === 0) {
      return res.status(400).json({ message: 'No items in cart to checkout' });
    }

    // Create the order
    const orderResult = await pool.query(
      `INSERT INTO orders (buyer_name, mobile_number, delivery_address)
       VALUES ($1, $2, $3) RETURNING id`,
      [buyer_name, mobile_number, delivery_address] 
    );

    const orderId = orderResult.rows[0].id;

    // Add items to the order
    for (const item of cartItemsResult.rows) {
      const { product_id, quantity, total_price } = item;
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, total_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, product_id, quantity, total_price]
      );
    }

    // Clear the cart
    await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

    res.status(201).json({ message: 'Checkout successful', order_id: orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to checkout' });
  }
});

export default serverless(app);