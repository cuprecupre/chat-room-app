import React from "react";
import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
    return (
        <HotToaster
            position="top-center"
            toastOptions={{
                className: "",
                style: {},
                icon: null,
            }}
            containerStyle={{
                top: 20,
            }}
        />
    );
}
