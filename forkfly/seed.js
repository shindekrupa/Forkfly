require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User, Restaurant, Order, Review } = require("./models");

// ---- restaurant data from the original prototype ----
const R=[
{id:1,n:"Spice Route Kitchen",c:"Indian",e:"🍛",r:4.6,rv:1280,t:"25–35",fee:0,p:"₹200–₹500",d:1.8,v:0,o:"Free Delivery",open:1,g:"#ffd9a8,#ffb36b",m:[["Butter Chicken","Creamy tomato gravy, charred chicken",329,0,"🍗","Main Course"],["Paneer Tikka","Smoky cottage cheese skewers",249,1,"🧀","Starters"],["Dal Makhani","Slow-cooked black lentils",219,1,"🍲","Main Course"],["Gulab Jamun","Warm syrup-soaked dumplings",99,1,"🍡","Desserts"],["Masala Chai","Ginger & cardamom",49,1,"☕","Beverages"]]},
{id:2,n:"Slice Society",c:"Pizza",e:"🍕",r:4.5,rv:960,t:"30–40",fee:30,p:"₹250–₹600",d:2.4,v:0,o:"20% OFF",open:1,g:"#ffcdd2,#ff8a80",m:[["Margherita Pizza","Fresh basil, mozzarella",249,1,"🍕","Pizza"],["Farmhouse Pizza","Loaded with veggies",329,1,"🍕","Pizza"],["Pepperoni Pizza","Double pepperoni",399,0,"🍕","Pizza"],["Garlic Bread","Buttery & crisp",129,1,"🥖","Starters"],["Tiramisu","Coffee-soaked layers",179,1,"🍰","Desserts"]]},
{id:3,n:"Burger Barn",c:"Burgers",e:"🍔",r:4.3,rv:740,t:"20–30",fee:20,p:"₹150–₹400",d:1.1,v:0,o:"₹100 OFF",open:1,g:"#fff0b3,#ffd54f",m:[["Cheese Burger","Juicy patty, melted cheddar",249,0,"🍔","Burgers"],["Veggie Crunch Burger","Crispy aloo-corn patty",199,1,"🍔","Burgers"],["Peri Peri Fries","Spicy & salty",119,1,"🍟","Starters"],["Oreo Shake","Thick & creamy",149,1,"🥤","Beverages"]]},
{id:4,n:"Dragon Wok",c:"Chinese",e:"🍜",r:4.2,rv:510,t:"35–45",fee:40,p:"₹200–₹450",d:3.6,v:0,o:"",open:1,g:"#d7f0d0,#8fd694",m:[["Hakka Noodles","Wok-tossed veg noodles",189,1,"🍜","Main Course"],["Chicken Manchurian","Tangy, spicy gravy",259,0,"🍗","Main Course"],["Veg Spring Rolls","Crispy golden rolls",149,1,"🌯","Starters"]]},
{id:5,n:"Sakura Sushi Bar",c:"Sushi",e:"🍣",r:4.7,rv:430,t:"40–50",fee:50,p:"₹400–₹900",d:4.2,v:0,o:"Weekend Special",open:0,g:"#fbd3e9,#f48fb1",m:[["Salmon Nigiri","6 pieces",549,0,"🍣","Main Course"],["Veg Maki Roll","8 pieces",399,1,"🍙","Main Course"]]},
{id:6,n:"Green Bowl",c:"Healthy",e:"🥗",r:4.4,rv:380,t:"20–30",fee:0,p:"₹180–₹350",d:0.9,v:1,o:"Free Delivery",open:1,g:"#c8f2d4,#7bd88f",m:[["Quinoa Power Bowl","Chickpeas, avocado, greens",269,1,"🥗","Recommended"],["Protein Smoothie","Banana, peanut butter",159,1,"🥤","Beverages"],["Fruit Parfait","Greek yogurt, berries",129,1,"🍓","Desserts"]]}];

const VX=[["Palak Paneer","Spinach gravy, soft paneer",239,1,"🥬","Main Course"],["Veg Biryani","Fragrant basmati, garden veg",219,1,"🍚","Main Course"],["Chole Bhature","Spiced chickpeas, fluffy bhature",179,1,"🫓","Main Course"],["Mushroom Tikka","Tandoori-grilled mushrooms",229,1,"🍄","Starters"],["Falafel Wrap","Hummus, pickles, tahini",169,1,"🌯","Main Course"],["Mango Lassi","Chilled & thick",89,1,"🥭","Beverages"]];
R.forEach(r=>{if(r.id!=6&&r.id!=5){VX.slice(0,3).forEach((m,i)=>{if(!r.m.some(x=>x[0]==VX[(i+r.id)%6][0]))r.m.push(VX[(i+r.id)%6])})}});
R.push({id:7,n:"Gujarati Thali House",c:"Indian",e:"🍱",r:4.8,rv:2100,t:"25–35",fee:0,p:"₹150–₹350",d:1.4,v:1,o:"Free Delivery",open:1,g:"#ffe9b0,#ffc65c",m:[["Full Gujarati Thali","Dal, kadhi, 2 sabzi, rotli, rice, sweet",299,1,"🍱","Recommended"],["Dhokla Plate","Soft steamed gram-flour cake",99,1,"🟨","Starters"],["Khandvi","Rolled gram-flour bites",119,1,"🌯","Starters"],["Undhiyu","Winter mixed-veg specialty",189,1,"🥕","Main Course"],["Thepla & Chhundo","Fenugreek flatbread, sweet-spicy pickle",129,1,"🫓","Main Course"],["Jalebi Fafda","Classic Sunday combo",109,1,"🥨","Desserts"],["Chaas","Spiced buttermilk",39,1,"🥛","Beverages"]]},
{id:8,n:"Chaat Corner",c:"Indian",e:"🥙",r:4.4,rv:890,t:"15–25",fee:10,p:"₹80–₹250",d:0.7,v:1,o:"₹50 OFF",open:1,g:"#ffd8c2,#ff9f6b",m:[["Pani Puri","6 crisp puris, tangy water",69,1,"🫧","Starters"],["Dabeli","Kutchi-style spiced potato bun",49,1,"🍔","Starters"],["Sev Puri","Crunchy, tangy, sweet",89,1,"🥙","Starters"],["Vada Pav","Mumbai classic",39,1,"🍔","Main Course"],["Pav Bhaji","Buttery mashed veg, soft pav",149,1,"🍛","Main Course"],["Kulfi Falooda","Creamy dessert",119,1,"🍨","Desserts"]]},
{id:9,n:"Pure Veg Pizzeria",c:"Pizza",e:"🍕",r:4.3,rv:620,t:"30–40",fee:20,p:"₹200–₹500",d:2.9,v:1,o:"20% OFF",open:1,g:"#e6f7c9,#a8dd6a",m:[["Paneer Tikka Pizza","Tandoori paneer, onions, capsicum",339,1,"🍕","Pizza"],["Corn & Cheese Pizza","Sweet corn, mozzarella",279,1,"🍕","Pizza"],["Veg Pasta Alfredo","Creamy white sauce",229,1,"🍝","Main Course"],["Cheesy Garlic Bread","Stuffed with mozzarella",149,1,"🥖","Starters"],["Brownie Sundae","Warm brownie, ice cream",179,1,"🍫","Desserts"]]});

// ---- write it to MongoDB ----
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  // WARNING: this wipes the existing data
  await Promise.all([User.deleteMany(), Restaurant.deleteMany(), Order.deleteMany(), Review.deleteMany()]);

  await Restaurant.insertMany(R.map(r => ({
    rid: r.id, name: r.n, cuisine: r.c, emoji: r.e, rating: r.r, reviewCount: r.rv,
    deliveryTime: r.t, deliveryFee: r.fee, priceRange: r.p, distance: r.d, pureVeg: !!r.v,
    offer: r.o, isOpen: !!r.open, gradient: r.g,
    menu: r.m.map(([name, description, price, veg, emoji, category]) => ({ name, description, price, veg: !!veg, emoji, category })),
  })));

  const hash = p => bcrypt.hash(p, 10);
  await User.create([
    { name: "Admin", email: "admin@forkfly.com", password: await hash("admin123"), role: "admin" },
    { name: "Spice Route Owner", email: "owner@forkfly.com", password: await hash("owner123"), role: "owner", restaurant: 1 },
    { name: "Demo Customer", email: "customer@forkfly.com", password: await hash("customer123") },
  ]);

  console.log("Seeded " + R.length + " restaurants and 3 demo users");
  await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });
