
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB42hPIazVjujZVSrniVO9-X3X6Com8d20",
  authDomain: "manara-27baf.firebaseapp.com",
  projectId: "manara-27baf",
  storageBucket: "manara-27baf.firebasestorage.app",
  messagingSenderId: "400135911136",
  appId: "1:400135911136:web:8b3da81e72238722130285",
  measurementId: "G-WZJPCNRVWV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Uploads a student photo to Firebase Storage and returns the download URL.
 */
export const uploadStudentPhoto = async (studentId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `students_photos/${studentId}_${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export default storage;
