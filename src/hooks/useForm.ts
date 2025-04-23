import { useState } from "react";

const useForm = <T extends Record<string, any>>(initialValues: Partial<T> = {}) => {
    const [formData, setFormData] = useState<T>(initialValues as T);

    const handleInputChange = (field: keyof T, value: T[keyof T]) => {
        setFormData((prevData) => ({
            ...prevData,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setFormData(initialValues as T);
    };

    return { formData, handleInputChange, resetForm };
};

export default useForm;