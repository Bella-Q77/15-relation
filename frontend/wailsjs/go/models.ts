export namespace frontend {
	
	export class FileFilter {
	    DisplayName: string;
	    Pattern: string;
	
	    static createFrom(source: any = {}) {
	        return new FileFilter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.DisplayName = source["DisplayName"];
	        this.Pattern = source["Pattern"];
	    }
	}

}

export namespace main {
	
	export class ClusterResult {
	    clusters: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new ClusterResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.clusters = source["clusters"];
	    }
	}
	export class Property {
	    key: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new Property(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}
	export class Entity {
	    id: string;
	    typeId: string;
	    label: string;
	    properties: Property[];
	    x?: number;
	    y?: number;
	
	    static createFrom(source: any = {}) {
	        return new Entity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.typeId = source["typeId"];
	        this.label = source["label"];
	        this.properties = this.convertValues(source["properties"], Property);
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EntityType {
	    id: string;
	    name: string;
	    color: string;
	    icon: string;
	
	    static createFrom(source: any = {}) {
	        return new EntityType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	        this.icon = source["icon"];
	    }
	}
	export class RelationType {
	    id: string;
	    name: string;
	    color: string;
	
	    static createFrom(source: any = {}) {
	        return new RelationType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	    }
	}
	export class Relationship {
	    id: string;
	    source: string;
	    target: string;
	    typeId: string;
	    label: string;
	    properties: Property[];
	    directed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Relationship(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.source = source["source"];
	        this.target = source["target"];
	        this.typeId = source["typeId"];
	        this.label = source["label"];
	        this.properties = this.convertValues(source["properties"], Property);
	        this.directed = source["directed"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GraphData {
	    entities: Entity[];
	    relationships: Relationship[];
	    entityTypes: EntityType[];
	    relationTypes: RelationType[];
	
	    static createFrom(source: any = {}) {
	        return new GraphData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.entities = this.convertValues(source["entities"], Entity);
	        this.relationships = this.convertValues(source["relationships"], Relationship);
	        this.entityTypes = this.convertValues(source["entityTypes"], EntityType);
	        this.relationTypes = this.convertValues(source["relationTypes"], RelationType);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HistoryEntry {
	    id: string;
	    timestamp: string;
	    action: string;
	    targetType: string;
	    targetId: string;
	    targetLabel: string;
	    detail: string;
	    snapshot?: string;
	
	    static createFrom(source: any = {}) {
	        return new HistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = source["timestamp"];
	        this.action = source["action"];
	        this.targetType = source["targetType"];
	        this.targetId = source["targetId"];
	        this.targetLabel = source["targetLabel"];
	        this.detail = source["detail"];
	        this.snapshot = source["snapshot"];
	    }
	}
	export class LinkAnalysisResult {
	    entities: Entity[];
	    relationships: Relationship[];
	
	    static createFrom(source: any = {}) {
	        return new LinkAnalysisResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.entities = this.convertValues(source["entities"], Entity);
	        this.relationships = this.convertValues(source["relationships"], Relationship);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NeuroDBStatus {
	    connected: boolean;
	    host: string;
	    port: number;
	    nodeCount: number;
	    linkCount: number;
	    embedded: boolean;
	    binaryPath: string;
	    installDir: string;
	
	    static createFrom(source: any = {}) {
	        return new NeuroDBStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connected = source["connected"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.nodeCount = source["nodeCount"];
	        this.linkCount = source["linkCount"];
	        this.embedded = source["embedded"];
	        this.binaryPath = source["binaryPath"];
	        this.installDir = source["installDir"];
	    }
	}
	export class PathResult {
	    paths: string[][];
	
	    static createFrom(source: any = {}) {
	        return new PathResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.paths = source["paths"];
	    }
	}
	
	
	
	export class SNAMetrics {
	    entityId: string;
	    degreeCentrality: number;
	    betweennessCentrality: number;
	    closenessCentrality: number;
	
	    static createFrom(source: any = {}) {
	        return new SNAMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.entityId = source["entityId"];
	        this.degreeCentrality = source["degreeCentrality"];
	        this.betweennessCentrality = source["betweennessCentrality"];
	        this.closenessCentrality = source["closenessCentrality"];
	    }
	}
	export class SNAResult {
	    metrics: SNAMetrics[];
	
	    static createFrom(source: any = {}) {
	        return new SNAResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.metrics = this.convertValues(source["metrics"], SNAMetrics);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

