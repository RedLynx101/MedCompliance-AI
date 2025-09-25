import PatientList from "@/components/patient-list";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Manage your patients and track compliance metrics</p>
      </div>
      <PatientList />
    </div>
  );
}
