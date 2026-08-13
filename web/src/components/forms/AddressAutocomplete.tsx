"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";

interface NominatimResult {
	place_id: number;
	display_name: string;
	lat: string;
	lon: string;
}

interface Props {
	value: string;
	onChange: (val: string) => void;
	id?: string;
	name?: string;
	placeholder?: string;
}

export function AddressAutocomplete({ value, onChange, id, name, placeholder }: Props) {
	const [query, setQuery] = useState(value);
	const [results, setResults] = useState<NominatimResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	
	const wrapperRef = useRef<HTMLDivElement>(null);
	const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

	// Sync prop with local state when it changes from outside
	useEffect(() => {
		setQuery(value);
	}, [value]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const searchAddress = async (text: string) => {
		if (text.length < 5) {
			setResults([]);
			return;
		}

		setLoading(true);
		try {
			// Nominatim public API (OpenStreetMap) - Respect usage policy (1 req/sec)
			const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text + ", Brasil")}&limit=5`);
			const data = await res.json();
			setResults(data);
			setShowDropdown(true);
		} catch (error) {
			console.error("Erro na busca de endereço:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setQuery(val);
		onChange(val); // Update parent form data
		
		if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
		
		debounceTimeout.current = setTimeout(() => {
			searchAddress(val);
		}, 600);
	};

	const selectAddress = (res: NominatimResult) => {
		setQuery(res.display_name);
		onChange(res.display_name);
		setShowDropdown(false);
	};

	return (
		<div className="relative w-full" ref={wrapperRef}>
			<div className="relative">
				<Input
					id={id}
					name={name}
					value={query}
					onChange={handleInputChange}
					onFocus={() => {
						if (results.length > 0) setShowDropdown(true);
					}}
					autoComplete="off"
					className="bg-slate-950 border-slate-800 pr-10"
					placeholder={placeholder || "Digite o endereço..."}
				/>
				{loading ? (
					<Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-500" />
				) : (
					<MapPin className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
				)}
			</div>

			{showDropdown && results.length > 0 && (
				<ul className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
					{results.map((res) => (
						<li
							key={res.place_id}
							onClick={() => selectAddress(res)}
							className="px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm text-slate-300 flex items-start gap-2 border-b border-slate-800/50 last:border-0"
						>
							<MapPin className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
							<span>{res.display_name}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
