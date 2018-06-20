function dist(p1, p2) {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;

  return Math.sqrt(a * a + b * b);
}

{
  // explicit block scope
  const p1 = { x: 1, y: -9 };
  const p2 = { x: -4, y: 13 };

  const d = dist(p1, p2);

  console.log("Distance: " + d);

  if (d > 0) {
    const apxd = Math.round(d);
    console.log("Distance is positive!", "≈" + apxd);
  }
}

// cond
if (0 > 1) {
  console.log("0 > 1");
} else if (1 < 0) {
  console.log("0 > 1");
} else if (9 < -9) {
  console.log("9 < -9");
}

// case
switch (1) {
  case 4:
    const h = 1;
    console.log(h);
    break;
  case 3:
    console.log(3);
    break;
  default:
    console.log("default case");
}
