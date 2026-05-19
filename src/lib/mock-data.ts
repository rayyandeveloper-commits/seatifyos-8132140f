export type CabinStatus = "available" | "occupied" | "renewal";

export interface Cabin {
  id: string;
  number: number;
  status: CabinStatus;
  student?: string;
  renewalIn?: string;
}

export interface Student {
  id: string;
  name: string;
  cabin: number;
  phone: string;
  joinedAt: string;
  renewalAt: string;
  paid: boolean;
  avatar: string;
}

export interface Transaction {
  id: string;
  student: string;
  amount: number;
  method: "UPI" | "Cash" | "Card";
  status: "paid" | "pending";
  date: string;
}

const names = [
  "Aarav Sharma","Diya Patel","Vihaan Singh","Anaya Kapoor","Arjun Mehta",
  "Saanvi Reddy","Kabir Verma","Ira Iyer","Reyansh Joshi","Myra Nair",
  "Aditya Rao","Ananya Das","Ishaan Gupta","Kiara Bhatia","Rohan Malhotra",
  "Pari Choudhary","Vivaan Khanna","Aadhya Sinha","Krishna Pillai","Aarohi Menon",
  "Dev Bansal","Tara Saxena","Yug Trivedi","Nitya Kulkarni","Aryan Bose",
];

export const cabins: Cabin[] = Array.from({ length: 24 }, (_, i) => {
  const number = i + 1;
  const seed = (number * 7) % 10;
  let status: CabinStatus = "occupied";
  if (seed < 3) status = "available";
  else if (seed < 5) status = "renewal";
  return {
    id: `c-${number}`,
    number,
    status,
    student: status === "available" ? undefined : names[(number * 3) % names.length],
    renewalIn: status === "renewal" ? ["Tomorrow","Today","In 2 days"][number % 3] : undefined,
  };
});

const today = TODAY;
// Fixed reference date so SSR and client render identical strings (no hydration mismatch).
export const TODAY = new Date("2026-05-19T00:00:00.000Z");
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const students: Student[] = names.map((name, i) => {
  const cabin = ((i * 5) % 24) + 1;
  const joined = addDays(today, -((i * 11) % 220) - 10);
  const renewal = addDays(today, ((i * 7) % 30) - 5);
  return {
    id: `s-${i + 1}`,
    name,
    cabin,
    phone: `+91 9${(800000000 + i * 731933).toString().slice(0, 9)}`,
    joinedAt: fmt(joined),
    renewalAt: fmt(renewal),
    paid: i % 4 !== 0,
    avatar: name.split(" ").map(p => p[0]).slice(0, 2).join(""),
  };
});

export const transactions: Transaction[] = students.slice(0, 14).map((s, i) => ({
  id: `t-${i + 1}`,
  student: s.name,
  amount: [1200, 1500, 1800, 2000][i % 4],
  method: (["UPI","Cash","Card"] as const)[i % 3],
  status: i % 5 === 0 ? "pending" : "paid",
  date: fmt(addDays(today, -i * 2)),
}));

export const revenueData = [
  { m: "Jan", v: 38000 }, { m: "Feb", v: 42000 }, { m: "Mar", v: 46000 },
  { m: "Apr", v: 51000 }, { m: "May", v: 48000 }, { m: "Jun", v: 55000 },
  { m: "Jul", v: 60000 }, { m: "Aug", v: 64000 }, { m: "Sep", v: 71000 },
  { m: "Oct", v: 78000 }, { m: "Nov", v: 82000 }, { m: "Dec", v: 91000 },
];

export const occupancyData = [
  { d: "Mon", o: 18 }, { d: "Tue", o: 19 }, { d: "Wed", o: 20 },
  { d: "Thu", o: 21 }, { d: "Fri", o: 22 }, { d: "Sat", o: 23 }, { d: "Sun", o: 21 },
];

export const activity = [
  { who: "Aarav Sharma", what: "renewed Cabin 04", when: "2m ago" },
  { who: "Diya Patel", what: "joined as new member", when: "18m ago" },
  { who: "Payment", what: "₹1,800 received from Kabir Verma", when: "1h ago" },
  { who: "Cabin 12", what: "marked as available", when: "3h ago" },
  { who: "Reminder sent", what: "to 4 students via WhatsApp", when: "5h ago" },
  { who: "Ira Iyer", what: "extended membership by 1 month", when: "Yesterday" },
];

export const stats = {
  totalCabins: cabins.length,
  occupied: cabins.filter(c => c.status === "occupied" || c.status === "renewal").length,
  available: cabins.filter(c => c.status === "available").length,
  renewalsDue: cabins.filter(c => c.status === "renewal").length,
  monthlyRevenue: 91200,
  monthlyRevenueDelta: 12.4,
};
