type EditWaypointModalModalProps = {
  waypoint: { waypointId: number; waypointName: string; orderNum: number };
  isOpen: boolean;
  onSave: (waypointName: string) => void;
  onClose: () => void;
  onChange: (newName: string) => void;
};

const EditWaypointModal: React.FC<EditWaypointModalModalProps> = ({
  waypoint,
  isOpen,
  onSave,
  onClose,
  onChange,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <form
        className="bg-white p-6 rounded shadow-lg w-full sm:w-96"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(waypoint.waypointName);
        }}
      >
        <h2 className="text-2xl mb-4">Edit Waypoint</h2>
        <div className="flex">
          <div className="mb-4 flex-1 mr-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              Change Name
            </label>
            <input
              type="waypointName"
              id="waypointName"
              name="waypointName"
              value={waypoint.waypointName}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Update
        </button>
        <div className="flex justify-center">
          <button
            type="button"
            className="mt-2 hover:text-red-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditWaypointModal;
