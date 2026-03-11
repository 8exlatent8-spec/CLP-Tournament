import { doc, setDoc, getDoc, getDocs, collection, query, where, addDoc } from "firebase/firestore"
import { database } from "./Firebase"

// Create document (auto ID)
export async function createDocument(collectionName, data) {
  const docRef = await addDoc(collection(database, collectionName), data);
  return docRef.id;
}
//Usage: const id = await createDocument("users", { name: "Bob", age: 22 });

// Create / overwrite document with custom ID
export async function setDocument(collectionName, docId, data) {
  await setDoc(doc(database, collectionName, docId), data);
  return docId;
}
//Usage: await setDocument("users", "user123", { name: "Bob" });
export async function getDocument(collectionName, docId) {
  const snap = await getDoc(doc(database, collectionName, docId));
  return snap.exists() ? snap.data() : null;
}

// Create team in tournament subcollection
export async function createTeam(tournamentId, teamData) {
  const teamRef = await addDoc(collection(database, "tournaments", tournamentId, "teams"), teamData);
  return teamRef.id;
}
//Usage: const teamId = await createTeam("tournament123", { name: "Team A", members: ["player1", "player2"] });

// Create match in tournament subcollection
export async function createMatch(tournamentId, matchData) {
  const matchRef = await addDoc(collection(database, "tournaments", tournamentId, "matches"), matchData);
  return matchRef.id;
}
//Usage: const matchId = await createMatch("tournament123", { team1: "teamA", team2: "teamB", status: "pending" });

// Get all teams for a tournament
export async function getTournamentTeams(tournamentId) {
  const teamsQuery = query(collection(database, "tournaments", tournamentId, "teams"));
  const snap = await getDocs(teamsQuery);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get all matches for a tournament
export async function getTournamentMatches(tournamentId) {
  const matchesQuery = query(collection(database, "tournaments", tournamentId, "matches"));
  const snap = await getDocs(matchesQuery);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}