class Base64 {
    static toBase64(input) {
        return btoa(encodeURIComponent(input)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    static fromBase64(input) {
        const paddedInput = input.length % 4 != 0 ? (input + '='.repeat(4 - input.length % 4)) : input;
        const decodedBase64 = paddedInput.replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(atob(decodedBase64));
    }

    static isBase64(input) {
        const str = input.replace(/=+$/, "")
        try {
            return Base64.toBase64(Base64.fromBase64(str)) === str;
        } catch (err) {
            return false;
        }
    }
}

module.exports = Base64;