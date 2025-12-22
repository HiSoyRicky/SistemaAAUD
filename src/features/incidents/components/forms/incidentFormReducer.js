export const INCIDENT_INITIAL_STATE = {
    showModal: false,
    id_incident: null,
    isSubmitting: false,
    errors: {},
    ubications: [],
    departments: [],
    formData: {
        reporter_name: "",
        email: "",
        id_ubication: null,
        id_department: null,
        id_device: "",
        description: "",
        id_category: "",
        other_category_detail: "",
    },
};

export function incidentFormReducer(state, action) {
    switch (action.type) {
        case "SET_FIELD": {
            const { name, value } = action.payload;
            return {
                ...state,
                formData: { ...state.formData, [name]: value },
                errors: { ...state.errors, [name]: "" },
            };
        }

        case "SET_UBIDEP": {
            const { id_ubication, id_department } = action.payload;
            return {
                ...state,
                formData: {
                    ...state.formData,
                    id_ubication: id_ubication ? parseInt(id_ubication) : null,
                    id_department: id_department ? parseInt(id_department) : null,
                },
                errors: { ...state.errors, id_ubication: "", id_department: "" },
            };
        }

        case "SET_ERRORS":
            return { ...state, errors: action.payload || {} };

        case "SET_OPTIONS":
            return {
                ...state,
                ubications: action.payload.ubications ?? state.ubications,
                departments: action.payload.departments ?? state.departments,
            };

        case "SUBMIT_START":
            return { ...state, isSubmitting: true };

        case "SUBMIT_END":
            return { ...state, isSubmitting: false };

        case "OPEN_MODAL":
            return { ...state, showModal: true };

        case "CLOSE_MODAL":
            return { ...state, showModal: false };

        case "SET_INCIDENT_ID":
            return { ...state, id_incident: action.payload };

        case "RESET_FORM":
            return {
                ...state,
                showModal: false,
                id_incident: null,
                errors: {},
                isSubmitting: false,
                formData: { ...INCIDENT_INITIAL_STATE.formData },
            };

        default:
            return state;
    }
}
